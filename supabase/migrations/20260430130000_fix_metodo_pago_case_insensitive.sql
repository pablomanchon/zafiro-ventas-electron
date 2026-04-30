-- Corrige ventas_crear para que el lookup de metodo_pago sea case-insensitive.
-- El upper() en el metodoId rompía UUIDs generados en minúsculas.

create or replace function public.ventas_crear(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id       bigint;
  v_vendedor_id      bigint;
  v_detalles         jsonb;
  v_pagos            jsonb;
  v_detalle          jsonb;
  v_pago             jsonb;
  v_total_detalles   numeric(10, 2) := 0;
  v_total_pagos      numeric(10, 2) := 0;
  v_producto_id      bigint;
  v_producto_codigo  text;
  v_producto_nombre  text;
  v_producto_descripcion text;
  v_producto_precio  numeric(10, 2);
  v_producto_stock   integer;
  v_item_id          bigint;
  v_venta_id         bigint;
  v_qty              integer;
  v_metodo_id        text;
  v_metodo_tipo      text;
  v_monto            numeric(10, 2);
  v_cuotas           integer;
  v_total_efectivo   numeric(10, 2) := 0;
  v_total_usd        numeric(10, 2) := 0;
  v_idempotency_key  uuid;
begin
  v_cliente_id      := nullif(payload ->> 'clienteId', '')::bigint;
  v_vendedor_id     := nullif(payload ->> 'vendedorId', '')::bigint;
  v_detalles        := coalesce(payload -> 'detalles', '[]'::jsonb);
  v_pagos           := coalesce(payload -> 'pagos', '[]'::jsonb);
  v_idempotency_key := nullif(payload ->> 'idempotencyKey', '')::uuid;

  -- Si ya existe una venta con esa key, devolverla sin crear nada nuevo
  if v_idempotency_key is not null then
    select id into v_venta_id
    from public.venta
    where idempotency_key = v_idempotency_key;

    if found then
      return public.ventas_detalle(v_venta_id);
    end if;
  end if;

  if v_cliente_id is null then
    raise exception 'Debe seleccionar un cliente';
  end if;

  if v_vendedor_id is null then
    raise exception 'Debe seleccionar un vendedor';
  end if;

  if jsonb_typeof(v_detalles) <> 'array' or jsonb_array_length(v_detalles) = 0 then
    raise exception 'Debe incluir al menos un producto con ID valido';
  end if;

  if jsonb_typeof(v_pagos) <> 'array' or jsonb_array_length(v_pagos) = 0 then
    raise exception 'Debe incluir al menos un metodo de pago con ID valido';
  end if;

  if not exists (
    select 1 from public.cliente
    where id = v_cliente_id and deleted = false
  ) then
    raise exception 'Cliente no encontrado';
  end if;

  if not exists (
    select 1 from public.vendedor
    where id = v_vendedor_id and deleted = false
  ) then
    raise exception 'Vendedor no encontrado';
  end if;

  -- Validar totales de detalles
  for v_detalle in select * from jsonb_array_elements(v_detalles)
  loop
    v_producto_id     := nullif(v_detalle ->> 'productoId', '')::bigint;
    v_qty             := coalesce((v_detalle -> 'item' ->> 'cantidad')::integer, 0);
    v_producto_precio := coalesce((v_detalle -> 'item' ->> 'precio')::numeric, 0);

    if v_producto_id is null then
      raise exception 'Debe incluir al menos un producto con ID valido';
    end if;

    if v_qty <= 0 then
      raise exception 'Cantidad invalida para producto %', v_producto_id;
    end if;

    v_total_detalles := v_total_detalles + (v_producto_precio * v_qty);
  end loop;

  -- Validar métodos de pago (case-insensitive)
  for v_pago in select * from jsonb_array_elements(v_pagos)
  loop
    v_metodo_id := btrim(coalesce(v_pago ->> 'metodoId', ''));
    v_monto     := coalesce((v_pago ->> 'monto')::numeric, 0);

    if v_metodo_id = '' then
      raise exception 'Debe incluir al menos un metodo de pago con ID valido';
    end if;

    if not exists (
      select 1 from public.metodo_pago
      where lower(id) = lower(v_metodo_id) and deleted = false
    ) then
      raise exception 'Metodo de pago no encontrado: %', v_metodo_id;
    end if;

    v_total_pagos := v_total_pagos + v_monto;
  end loop;

  if round(v_total_detalles::numeric, 2) <> round(v_total_pagos::numeric, 2) then
    raise exception 'Total de pagos (%) no coincide con total de venta (%)', v_total_pagos, v_total_detalles;
  end if;

  insert into public.venta (cliente_id, vendedor_id, total, deleted, idempotency_key)
  values (v_cliente_id, v_vendedor_id, round(v_total_detalles::numeric, 2), false, v_idempotency_key)
  returning id into v_venta_id;

  for v_detalle in select * from jsonb_array_elements(v_detalles)
  loop
    v_producto_id := (v_detalle ->> 'productoId')::bigint;
    v_qty         := (v_detalle -> 'item' ->> 'cantidad')::integer;

    select id, codigo, nombre, descripcion, precio, stock
    into v_producto_id, v_producto_codigo, v_producto_nombre, v_producto_descripcion, v_producto_precio, v_producto_stock
    from public.producto
    where id = (v_detalle ->> 'productoId')::bigint
      and deleted = false
    for update;

    if v_producto_id is null then
      raise exception 'Producto % no encontrado', v_detalle ->> 'productoId';
    end if;

    if v_producto_stock < v_qty then
      raise exception 'Stock insuficiente para "%" (stock: %, solicitado: %)', v_producto_nombre, v_producto_stock, v_qty;
    end if;

    update public.producto
    set stock = stock - v_qty
    where id = v_producto_id;

    insert into public.item_venta (codigo, nombre, descripcion, precio, cantidad)
    values (
      v_producto_codigo,
      coalesce(v_detalle -> 'item' ->> 'nombre', v_producto_nombre),
      coalesce(v_detalle -> 'item' ->> 'descripcion', v_producto_descripcion),
      coalesce((v_detalle -> 'item' ->> 'precio')::numeric, v_producto_precio),
      v_qty
    )
    returning id into v_item_id;

    insert into public.venta_detalle (venta_id, item_id)
    values (v_venta_id, v_item_id);
  end loop;

  -- Insertar pagos resolviendo el ID real (case-insensitive)
  for v_pago in select * from jsonb_array_elements(v_pagos)
  loop
    v_metodo_id := btrim(v_pago ->> 'metodoId');
    v_monto     := (v_pago ->> 'monto')::numeric;
    v_cuotas    := nullif(v_pago ->> 'cuotas', '')::integer;

    -- Resolver el ID y tipo tal como están guardados en la BD
    select id, tipo into v_metodo_id, v_metodo_tipo
    from public.metodo_pago
    where lower(id) = lower(v_metodo_id)
      and deleted = false;

    insert into public.venta_pago (venta_id, metodo_id, monto, cuotas)
    values (v_venta_id, v_metodo_id, v_monto, v_cuotas);

    if lower(v_metodo_tipo) = 'efectivo' then
      v_total_efectivo := v_total_efectivo + v_monto;
    elsif lower(v_metodo_tipo) = 'usd' then
      v_total_usd := v_total_usd + v_monto;
    end if;
  end loop;

  if v_total_efectivo > 0 then
    perform public.caja_aumentar_saldo('pesos', v_total_efectivo);
  end if;

  if v_total_usd > 0 then
    perform public.caja_aumentar_saldo('usd', v_total_usd);
  end if;

  return public.ventas_detalle(v_venta_id);
end;
$$;
