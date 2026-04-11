create or replace function public.ensure_caja_exists()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.caja (id, saldo_pesos, saldo_usd)
  values ('main', 0, 0)
  on conflict (id) do nothing;
end;
$$;

create or replace function public.horario_to_json(p_id bigint)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id', h.id,
    'horaIngreso', h.hora_ingreso,
    'horaEgreso', h.hora_egreso,
    'vendedor',
      case
        when v.id is null then null
        else jsonb_build_object('id', v.id, 'nombre', v.nombre)
      end
  )
  from public.horario h
  left join public.vendedor v on v.id = h.vendedor_id
  where h.id = p_id;
$$;

create or replace function public.movimiento_stock_to_json(p_id bigint)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id', m.id,
    'productsMoveStock', m.products_move_stock,
    'fecha', m.fecha,
    'moveType', m.move_type,
    'deleted', m.deleted
  )
  from public.movimiento_stock m
  where m.id = p_id;
$$;

create or replace function public.venta_to_json(p_id bigint)
returns jsonb
language sql
stable
set search_path = public
as $$
  select jsonb_build_object(
    'id', v.id,
    'fecha', v.fecha,
    'total', v.total,
    'deleted', v.deleted,
    'clienteId', v.cliente_id,
    'vendedorId', v.vendedor_id,
    'cliente', jsonb_build_object(
      'id', c.id,
      'nombre', c.nombre,
      'apellido', c.apellido,
      'email', c.email,
      'telefono', c.telefono,
      'direccion', c.direccion,
      'deleted', c.deleted
    ),
    'vendedor',
      case
        when ven.id is null then null
        else jsonb_build_object(
          'id', ven.id,
          'nombre', ven.nombre,
          'deleted', ven.deleted
        )
      end,
    'detalles', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', vd.id,
          'item', jsonb_build_object(
            'id', iv.id,
            'codigo', iv.codigo,
            'nombre', iv.nombre,
            'descripcion', iv.descripcion,
            'precio', iv.precio,
            'cantidad', iv.cantidad
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
          'id', vp.id,
          'metodoId', mp.id,
          'monto', vp.monto,
          'cuotas', vp.cuotas,
          'metodo', jsonb_build_object(
            'id', mp.id,
            'nombre', mp.nombre,
            'tipo', mp.tipo,
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

create or replace function public.caja_obtener_saldos()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caja public.caja%rowtype;
begin
  perform public.ensure_caja_exists();

  select * into v_caja
  from public.caja
  where id = 'main';

  return jsonb_build_object(
    'pesos', coalesce(v_caja.saldo_pesos, 0),
    'usd', coalesce(v_caja.saldo_usd, 0)
  );
end;
$$;

create or replace function public.caja_aumentar_saldo(p_moneda text, p_monto numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caja public.caja%rowtype;
begin
  if p_moneda not in ('pesos', 'usd') then
    raise exception 'Moneda invalida';
  end if;

  if coalesce(p_monto, 0) <= 0 then
    raise exception 'El monto debe ser mayor a 0';
  end if;

  perform public.ensure_caja_exists();

  select * into v_caja
  from public.caja
  where id = 'main'
  for update;

  if p_moneda = 'pesos' then
    update public.caja
    set saldo_pesos = saldo_pesos + p_monto
    where id = 'main';

    insert into public.caja_move_detail (saldo_pesos, saldo_usd, move_type)
    values (p_monto, 0, 'in');
  else
    update public.caja
    set saldo_usd = saldo_usd + p_monto
    where id = 'main';

    insert into public.caja_move_detail (saldo_pesos, saldo_usd, move_type)
    values (0, p_monto, 'in');
  end if;

  return public.caja_obtener_saldos();
end;
$$;

create or replace function public.caja_disminuir_saldo(p_moneda text, p_monto numeric)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caja public.caja%rowtype;
begin
  if p_moneda not in ('pesos', 'usd') then
    raise exception 'Moneda invalida';
  end if;

  if coalesce(p_monto, 0) <= 0 then
    raise exception 'El monto debe ser mayor a 0';
  end if;

  perform public.ensure_caja_exists();

  select * into v_caja
  from public.caja
  where id = 'main'
  for update;

  if p_moneda = 'pesos' then
    if coalesce(v_caja.saldo_pesos, 0) < p_monto then
      raise exception 'Saldo en pesos insuficiente.';
    end if;

    update public.caja
    set saldo_pesos = saldo_pesos - p_monto
    where id = 'main';

    insert into public.caja_move_detail (saldo_pesos, saldo_usd, move_type)
    values (p_monto, 0, 'out');
  else
    if coalesce(v_caja.saldo_usd, 0) < p_monto then
      raise exception 'Saldo en dolares insuficiente.';
    end if;

    update public.caja
    set saldo_usd = saldo_usd - p_monto
    where id = 'main';

    insert into public.caja_move_detail (saldo_pesos, saldo_usd, move_type)
    values (0, p_monto, 'out');
  end if;

  return public.caja_obtener_saldos();
end;
$$;

create or replace function public.caja_listar_movimientos()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'monto', case when c.saldo_pesos > 0 then c.saldo_pesos else c.saldo_usd end,
        'moneda', case when c.saldo_pesos > 0 then 'pesos' else 'usd' end,
        'moveType', c.move_type,
        'createdAt', c.created_at,
        'updatedAt', c.updated_at
      )
      order by c.created_at desc
    ),
    '[]'::jsonb
  )
  from public.caja_move_detail c;
$$;

create or replace function public.horarios_listar()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(public.horario_to_json(h.id) order by h.hora_ingreso desc),
    '[]'::jsonb
  )
  from public.horario h;
$$;

create or replace function public.horarios_marcar_ingreso(
  p_vendedor_id bigint,
  p_hora_ingreso timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
begin
  if not exists (
    select 1 from public.vendedor
    where id = p_vendedor_id and deleted = false
  ) then
    raise exception 'Vendedor no encontrado';
  end if;

  if exists (
    select 1 from public.horario
    where vendedor_id = p_vendedor_id and hora_egreso is null
  ) then
    raise exception 'Este vendedor ya tiene un horario abierto';
  end if;

  insert into public.horario (vendedor_id, hora_ingreso, hora_egreso)
  values (p_vendedor_id, coalesce(p_hora_ingreso, now()), null)
  returning id into v_id;

  return public.horario_to_json(v_id);
end;
$$;

create or replace function public.horarios_marcar_egreso(
  p_vendedor_id bigint,
  p_hora_egreso timestamptz default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id bigint;
  v_ingreso timestamptz;
  v_egreso timestamptz;
begin
  select id, hora_ingreso
  into v_id, v_ingreso
  from public.horario
  where vendedor_id = p_vendedor_id
    and hora_egreso is null
  order by hora_ingreso desc
  limit 1;

  if v_id is null then
    raise exception 'No hay un horario abierto para este vendedor';
  end if;

  v_egreso := coalesce(p_hora_egreso, now());
  if v_egreso < v_ingreso then
    raise exception 'La hora de egreso no puede ser anterior al ingreso';
  end if;

  update public.horario
  set hora_egreso = v_egreso
  where id = v_id;

  return public.horario_to_json(v_id);
end;
$$;

create or replace function public.movimiento_stock_listar()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(public.movimiento_stock_to_json(m.id) order by m.fecha desc),
    '[]'::jsonb
  )
  from public.movimiento_stock m
  where m.deleted = false;
$$;

create or replace function public.movimiento_stock_detalle(p_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.movimiento_stock_to_json(m.id)
  from public.movimiento_stock m
  where m.id = p_id
    and m.deleted = false;
$$;

create or replace function public.movimiento_stock_crear(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_move_type text;
  v_products jsonb;
  v_item jsonb;
  v_codigo text;
  v_qty numeric;
  v_stock integer;
  v_producto_id bigint;
  v_movimiento_id bigint;
begin
  v_move_type := payload ->> 'moveType';
  v_products := coalesce(payload -> 'products', '[]'::jsonb);

  if v_move_type not in ('in', 'out') then
    raise exception 'Tipo de movimiento invalido';
  end if;

  if jsonb_typeof(v_products) <> 'array' or jsonb_array_length(v_products) = 0 then
    raise exception 'No hay productos para mover';
  end if;

  for v_item in select * from jsonb_array_elements(v_products)
  loop
    v_codigo := btrim(coalesce(v_item ->> 'idProduct', ''));
    v_qty := coalesce((v_item ->> 'quantity')::numeric, 0);

    if v_codigo = '' then
      raise exception 'Hay un producto sin codigo';
    end if;

    if v_qty <= 0 then
      raise exception 'Cantidad invalida para producto "%"', v_codigo;
    end if;

    select id, stock
    into v_producto_id, v_stock
    from public.producto
    where codigo = v_codigo
      and deleted = false
    for update;

    if v_producto_id is null then
      raise exception 'Producto codigo "%" no encontrado', v_codigo;
    end if;

    if v_move_type = 'out' and v_stock < v_qty then
      raise exception 'Stock insuficiente en "%" (tiene %, necesita %)', v_codigo, v_stock, v_qty;
    end if;
  end loop;

  for v_item in select * from jsonb_array_elements(v_products)
  loop
    v_codigo := btrim(v_item ->> 'idProduct');
    v_qty := (v_item ->> 'quantity')::numeric;

    update public.producto
    set stock = case
      when v_move_type = 'in' then stock + v_qty::integer
      else stock - v_qty::integer
    end
    where codigo = v_codigo
      and deleted = false;
  end loop;

  insert into public.movimiento_stock (products_move_stock, move_type, deleted)
  values (v_products, v_move_type, false)
  returning id into v_movimiento_id;

  return jsonb_build_object(
    'id', v_movimiento_id,
    'movimientoId', v_movimiento_id,
    'message', format('Movimiento %s aplicado', case when v_move_type = 'in' then 'entrada' else 'salida' end),
    'totalProductos', jsonb_array_length(v_products)
  );
end;
$$;

create or replace function public.ventas_detalle(p_id bigint)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select public.venta_to_json(v.id)
  from public.venta v
  where v.id = p_id
    and v.deleted = false;
$$;

create or replace function public.ventas_listar(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(sale.sale_json order by sale.fecha desc),
    '[]'::jsonb
  )
  from (
    select v.id, v.fecha, public.venta_to_json(v.id) as sale_json
    from public.venta v
    join public.cliente c on c.id = v.cliente_id
    where v.deleted = false
      and c.deleted = false
      and (p_from is null or v.fecha >= p_from)
      and (p_to is null or v.fecha < (p_to + interval '1 day'))
  ) sale;
$$;

create or replace function public.ventas_totales_por_tipo_pago(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('tipo', rows.tipo, 'total', rows.total)
      order by rows.total desc
    ),
    '[]'::jsonb
  )
  from (
    select mp.tipo, coalesce(sum(vp.monto), 0) as total
    from public.venta_pago vp
    join public.venta v on v.id = vp.venta_id
    join public.metodo_pago mp on mp.id = vp.metodo_id
    where v.deleted = false
      and (p_from is null or v.fecha >= p_from)
      and (p_to is null or v.fecha < (p_to + interval '1 day'))
    group by mp.tipo
  ) rows;
$$;

create or replace function public.ventas_productos_vendidos(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'nombre', rows.nombre,
        'cantidad', rows.cantidad,
        'importe', rows.importe
      )
      order by rows.cantidad desc
    ),
    '[]'::jsonb
  )
  from (
    select
      iv.nombre,
      sum(iv.cantidad) as cantidad,
      sum(iv.precio * iv.cantidad) as importe
    from public.venta_detalle vd
    join public.item_venta iv on iv.id = vd.item_id
    join public.venta v on v.id = vd.venta_id
    where v.deleted = false
      and (p_from is null or v.fecha >= p_from)
      and (p_to is null or v.fecha < (p_to + interval '1 day'))
    group by iv.nombre
  ) rows;
$$;

create or replace function public.ventas_borrar(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.venta
  set deleted = true
  where id = p_id
    and deleted = false;

  if not found then
    raise exception 'Venta no encontrada';
  end if;

  return jsonb_build_object('deleted', true, 'id', p_id);
end;
$$;

create or replace function public.ventas_actualizar(p_id bigint, payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id bigint;
  v_vendedor_id bigint;
begin
  if not exists (
    select 1 from public.venta where id = p_id and deleted = false
  ) then
    raise exception 'Venta no encontrada';
  end if;

  v_cliente_id := nullif(payload ->> 'clienteId', '')::bigint;
  v_vendedor_id := nullif(payload ->> 'vendedorId', '')::bigint;

  if v_cliente_id is not null then
    if not exists (select 1 from public.cliente where id = v_cliente_id and deleted = false) then
      raise exception 'Cliente no encontrado';
    end if;
  end if;

  if v_vendedor_id is not null then
    if not exists (select 1 from public.vendedor where id = v_vendedor_id and deleted = false) then
      raise exception 'Vendedor no encontrado';
    end if;
  end if;

  update public.venta
  set cliente_id = coalesce(v_cliente_id, cliente_id),
      vendedor_id = coalesce(v_vendedor_id, vendedor_id)
  where id = p_id;

  return public.ventas_detalle(p_id);
end;
$$;

create or replace function public.ventas_crear(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cliente_id bigint;
  v_vendedor_id bigint;
  v_detalles jsonb;
  v_pagos jsonb;
  v_detalle jsonb;
  v_pago jsonb;
  v_total_detalles numeric(10, 2) := 0;
  v_total_pagos numeric(10, 2) := 0;
  v_producto_id bigint;
  v_producto_codigo text;
  v_producto_nombre text;
  v_producto_descripcion text;
  v_producto_precio numeric(10, 2);
  v_producto_stock integer;
  v_item_id bigint;
  v_venta_id bigint;
  v_qty integer;
  v_metodo_id text;
  v_metodo_tipo text;
  v_monto numeric(10, 2);
  v_cuotas integer;
  v_total_efectivo numeric(10, 2) := 0;
  v_total_usd numeric(10, 2) := 0;
begin
  v_cliente_id := nullif(payload ->> 'clienteId', '')::bigint;
  v_vendedor_id := nullif(payload ->> 'vendedorId', '')::bigint;
  v_detalles := coalesce(payload -> 'detalles', '[]'::jsonb);
  v_pagos := coalesce(payload -> 'pagos', '[]'::jsonb);

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
    v_producto_id := nullif(v_detalle ->> 'productoId', '')::bigint;
    v_qty := coalesce((v_detalle -> 'item' ->> 'cantidad')::integer, 0);
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
    v_monto := coalesce((v_pago ->> 'monto')::numeric, 0);

    if v_metodo_id = '' then
      raise exception 'Debe incluir al menos un metodo de pago con ID valido';
    end if;

    v_total_pagos := v_total_pagos + v_monto;
  end loop;

  if round(v_total_detalles::numeric, 2) <> round(v_total_pagos::numeric, 2) then
    raise exception 'Total de pagos (%) no coincide con total de venta (%)', v_total_pagos, v_total_detalles;
  end if;

  insert into public.venta (cliente_id, vendedor_id, total, deleted)
  values (v_cliente_id, v_vendedor_id, round(v_total_detalles::numeric, 2), false)
  returning id into v_venta_id;

  for v_detalle in select * from jsonb_array_elements(v_detalles)
  loop
    v_producto_id := (v_detalle ->> 'productoId')::bigint;
    v_qty := (v_detalle -> 'item' ->> 'cantidad')::integer;

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
    v_metodo_id := upper(btrim(v_pago ->> 'metodoId'));
    v_monto := (v_pago ->> 'monto')::numeric;
    v_cuotas := nullif(v_pago ->> 'cuotas', '')::integer;

    select tipo into v_metodo_tipo
    from public.metodo_pago
    where id = v_metodo_id
      and deleted = false;

    if v_metodo_tipo is null then
      raise exception 'Metodo de pago no encontrado: %', v_metodo_id;
    end if;

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
