-- 1. Tipo de cambio USD en kiosco
alter table public.kioscos
  add column if not exists tipo_cambio_usd numeric(10,2) not null default 1000;

-- 2. Campos de trazabilidad en venta_pago
alter table public.venta_pago
  add column if not exists monto_usd numeric(10,2);
alter table public.venta_pago
  add column if not exists tipo_cambio numeric(10,2);

-- 3. kiosco_obtener: devuelve tipoCambioUsd
create or replace function public.kiosco_obtener()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id',            k.id,
    'nombre',        k.nombre,
    'telefono',      k.telefono,
    'direccion',     k.direccion,
    'tipoCambioUsd', k.tipo_cambio_usd
  )
  from public.kioscos k
  where k.id = public.current_kiosco_id();
$$;

-- 4. kiosco_actualizar: acepta p_tipo_cambio_usd
create or replace function public.kiosco_actualizar(
  p_nombre          text,
  p_telefono        text    default null,
  p_direccion       text    default null,
  p_tipo_cambio_usd numeric default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if nullif(trim(p_nombre), '') is null then
    raise exception 'El nombre no puede estar vacío';
  end if;
  update public.kioscos
  set
    nombre          = trim(p_nombre),
    telefono        = nullif(trim(coalesce(p_telefono, '')), ''),
    direccion       = nullif(trim(coalesce(p_direccion, '')), ''),
    tipo_cambio_usd = coalesce(p_tipo_cambio_usd, tipo_cambio_usd)
  where id = public.current_kiosco_id();
end;
$$;

-- 5. venta_to_json: incluye montoUsd y tipoCambio en pagos
create or replace function public.venta_to_json(p_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id',         v.id,
    'fecha',      v.fecha,
    'total',      v.total,
    'deleted',    v.deleted,
    'clienteId',  v.cliente_id,
    'vendedorId', v.vendedor_id,
    'cliente', jsonb_build_object(
      'id',        c.id,
      'nombre',    c.nombre,
      'apellido',  c.apellido,
      'email',     c.email,
      'telefono',  c.telefono,
      'direccion', c.direccion,
      'deleted',   c.deleted
    ),
    'vendedor',
      case
        when ven.id is null then null
        else jsonb_build_object(
          'id',      ven.id,
          'nombre',  ven.nombre,
          'deleted', ven.deleted
        )
      end,
    'detalles', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', vd.id,
          'item', jsonb_build_object(
            'id',          iv.id,
            'codigo',      iv.codigo,
            'nombre',      iv.nombre,
            'descripcion', iv.descripcion,
            'precio',      iv.precio,
            'cantidad',    iv.cantidad
          )
        )
        order by vd.id
      )
      from public.venta_detalle vd
      join public.item_venta iv on iv.id = vd.item_id
      where vd.venta_id = v.id
    ), '[]'::jsonb),
    'pagos', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id',         vp.id,
          'metodoId',   mp.id,
          'monto',      vp.monto,
          'montoUsd',   vp.monto_usd,
          'tipoCambio', vp.tipo_cambio,
          'cuotas',     vp.cuotas,
          'metodo', jsonb_build_object(
            'id',      mp.id,
            'nombre',  mp.nombre,
            'tipo',    mp.tipo,
            'deleted', mp.deleted
          )
        )
        order by vp.id
      )
      from public.venta_pago vp
      join public.metodo_pago mp on mp.id = vp.metodo_id
      where vp.venta_id = v.id
    ), '[]'::jsonb)
  )
  from public.venta v
  join public.cliente c on c.id = v.cliente_id
  left join public.vendedor ven on ven.id = v.vendedor_id
  where v.id = p_id;
$$;

-- 6. ventas_crear: guarda monto_usd/tipo_cambio y usa USD real en caja
create or replace function public.ventas_crear(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id          bigint;
  v_vendedor_id         bigint;
  v_detalles            jsonb;
  v_pagos               jsonb;
  v_detalle             jsonb;
  v_pago                jsonb;
  v_total_detalles      numeric(10, 2) := 0;
  v_total_pagos         numeric(10, 2) := 0;
  v_producto_id         bigint;
  v_producto_codigo     text;
  v_producto_nombre     text;
  v_producto_descripcion text;
  v_producto_precio     numeric(10, 2);
  v_producto_stock      integer;
  v_item_id             bigint;
  v_venta_id            bigint;
  v_qty                 integer;
  v_metodo_id           text;
  v_metodo_tipo         text;
  v_monto               numeric(10, 2);
  v_monto_usd           numeric(10, 2);
  v_tipo_cambio         numeric(10, 2);
  v_cuotas              integer;
  v_total_efectivo      numeric(10, 2) := 0;
  v_total_usd           numeric(10, 2) := 0;
  v_idempotency_key     uuid;
begin
  v_cliente_id      := nullif(payload ->> 'clienteId', '')::bigint;
  v_vendedor_id     := nullif(payload ->> 'vendedorId', '')::bigint;
  v_detalles        := coalesce(payload -> 'detalles', '[]'::jsonb);
  v_pagos           := coalesce(payload -> 'pagos', '[]'::jsonb);
  v_idempotency_key := nullif(payload ->> 'idempotencyKey', '')::uuid;

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

  for v_pago in select * from jsonb_array_elements(v_pagos)
  loop
    v_metodo_id := upper(btrim(coalesce(v_pago ->> 'metodoId', '')));
    v_monto     := coalesce((v_pago ->> 'monto')::numeric, 0);

    if v_metodo_id = '' then
      raise exception 'Debe incluir al menos un metodo de pago con ID valido';
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

  for v_pago in select * from jsonb_array_elements(v_pagos)
  loop
    v_metodo_id   := upper(btrim(v_pago ->> 'metodoId'));
    v_monto       := (v_pago ->> 'monto')::numeric;
    v_cuotas      := nullif(v_pago ->> 'cuotas', '')::integer;
    v_monto_usd   := nullif(v_pago ->> 'montoUsd', '')::numeric;
    v_tipo_cambio := nullif(v_pago ->> 'tipoCambio', '')::numeric;

    select tipo into v_metodo_tipo
    from public.metodo_pago
    where id = v_metodo_id
      and deleted = false;

    if v_metodo_tipo is null then
      raise exception 'Metodo de pago no encontrado: %', v_metodo_id;
    end if;

    insert into public.venta_pago (venta_id, metodo_id, monto, cuotas, monto_usd, tipo_cambio)
    values (v_venta_id, v_metodo_id, v_monto, v_cuotas, v_monto_usd, v_tipo_cambio);

    if lower(v_metodo_tipo) = 'efectivo' then
      v_total_efectivo := v_total_efectivo + v_monto;
    elsif lower(v_metodo_tipo) = 'usd' then
      -- Usa el monto en USD real para la caja (no el equivalente ARS)
      v_total_usd := v_total_usd + coalesce(v_monto_usd, 0);
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

grant execute on function public.kiosco_obtener() to authenticated;
grant execute on function public.kiosco_actualizar(text, text, text, numeric) to authenticated;
