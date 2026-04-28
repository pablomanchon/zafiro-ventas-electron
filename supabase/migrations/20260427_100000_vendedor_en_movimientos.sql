-- Agregar vendedor_id a movimiento_stock y caja_move_detail

alter table public.movimiento_stock
  add column if not exists vendedor_id bigint null references public.vendedor(id) on delete set null;

alter table public.caja_move_detail
  add column if not exists vendedor_id bigint null references public.vendedor(id) on delete set null;

-- movimiento_stock_to_json con vendedor (reemplaza la versión del tenant hardening)
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
    'deleted', m.deleted,
    'vendedorId', m.vendedor_id,
    'vendedor',
      case
        when v.id is null then null
        else jsonb_build_object('id', v.id, 'nombre', v.nombre)
      end
  )
  from public.movimiento_stock m
  left join public.vendedor v on v.id = m.vendedor_id
  where m.id = p_id
    and m.kiosco_id = public.current_kiosco_id();
$$;

-- movimiento_stock_crear con vendedorId opcional en el payload
create or replace function public.movimiento_stock_crear(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_move_type    text;
  v_products     jsonb;
  v_item         jsonb;
  v_codigo       text;
  v_qty          numeric;
  v_stock        integer;
  v_producto_id  bigint;
  v_movimiento_id bigint;
  v_kiosco_id    uuid;
  v_vendedor_id  bigint;
begin
  v_kiosco_id   := public.current_kiosco_id();
  v_move_type   := payload ->> 'moveType';
  v_products    := coalesce(payload -> 'products', '[]'::jsonb);
  v_vendedor_id := nullif(payload ->> 'vendedorId', '')::bigint;

  if v_move_type not in ('in', 'out') then
    raise exception 'Tipo de movimiento invalido';
  end if;

  if jsonb_typeof(v_products) <> 'array' or jsonb_array_length(v_products) = 0 then
    raise exception 'No hay productos para mover';
  end if;

  if v_vendedor_id is not null then
    if not exists (
      select 1 from public.vendedor
      where id = v_vendedor_id and deleted = false and kiosco_id = v_kiosco_id
    ) then
      raise exception 'Vendedor no encontrado';
    end if;
  end if;

  for v_item in select * from jsonb_array_elements(v_products)
  loop
    v_codigo := btrim(coalesce(v_item ->> 'idProduct', ''));
    v_qty    := coalesce((v_item ->> 'quantity')::numeric, 0);

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
      and kiosco_id = v_kiosco_id
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
    v_qty    := (v_item ->> 'quantity')::numeric;

    update public.producto
    set stock = case
      when v_move_type = 'in' then stock + v_qty::integer
      else stock - v_qty::integer
    end
    where codigo = v_codigo
      and deleted = false
      and kiosco_id = v_kiosco_id;
  end loop;

  insert into public.movimiento_stock (products_move_stock, move_type, deleted, kiosco_id, vendedor_id)
  values (v_products, v_move_type, false, v_kiosco_id, v_vendedor_id)
  returning id into v_movimiento_id;

  return jsonb_build_object(
    'id', v_movimiento_id,
    'movimientoId', v_movimiento_id,
    'message', format('Movimiento %s aplicado', case when v_move_type = 'in' then 'entrada' else 'salida' end),
    'totalProductos', jsonb_array_length(v_products)
  );
end;
$$;

-- caja_aumentar_saldo con p_vendedor_id opcional (compatible con llamadas internas sin vendedor)
create or replace function public.caja_aumentar_saldo(
  p_moneda      text,
  p_monto       numeric,
  p_vendedor_id bigint default null
)
returns jsonb
language plpgsql
as $$
declare
  v_caja      public.caja%rowtype;
  v_kiosco_id uuid;
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if p_moneda not in ('pesos', 'usd') then
    raise exception 'Moneda invalida: %', p_moneda;
  end if;

  v_kiosco_id := public.current_kiosco_id();
  perform public.ensure_caja_exists();

  select * into v_caja
  from public.caja
  where kiosco_id = v_kiosco_id
  for update;

  if p_moneda = 'pesos' then
    update public.caja
    set saldo_pesos = coalesce(saldo_pesos, 0) + p_monto
    where kiosco_id = v_kiosco_id;

    insert into public.caja_move_detail (kiosco_id, saldo_pesos, saldo_usd, move_type, vendedor_id)
    values (v_kiosco_id, p_monto, 0, 'in', p_vendedor_id);
  else
    update public.caja
    set saldo_usd = coalesce(saldo_usd, 0) + p_monto
    where kiosco_id = v_kiosco_id;

    insert into public.caja_move_detail (kiosco_id, saldo_pesos, saldo_usd, move_type, vendedor_id)
    values (v_kiosco_id, 0, p_monto, 'in', p_vendedor_id);
  end if;

  return public.caja_obtener_saldos();
end;
$$;

-- caja_disminuir_saldo con p_vendedor_id opcional
create or replace function public.caja_disminuir_saldo(
  p_moneda      text,
  p_monto       numeric,
  p_vendedor_id bigint default null
)
returns jsonb
language plpgsql
as $$
declare
  v_caja      public.caja%rowtype;
  v_kiosco_id uuid;
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if p_moneda not in ('pesos', 'usd') then
    raise exception 'Moneda invalida: %', p_moneda;
  end if;

  v_kiosco_id := public.current_kiosco_id();
  perform public.ensure_caja_exists();

  select * into v_caja
  from public.caja
  where kiosco_id = v_kiosco_id
  for update;

  if p_moneda = 'pesos' then
    if coalesce(v_caja.saldo_pesos, 0) < p_monto then
      raise exception 'Saldo insuficiente en pesos';
    end if;

    update public.caja
    set saldo_pesos = coalesce(saldo_pesos, 0) - p_monto
    where kiosco_id = v_kiosco_id;

    insert into public.caja_move_detail (kiosco_id, saldo_pesos, saldo_usd, move_type, vendedor_id)
    values (v_kiosco_id, p_monto, 0, 'out', p_vendedor_id);
  else
    if coalesce(v_caja.saldo_usd, 0) < p_monto then
      raise exception 'Saldo insuficiente en usd';
    end if;

    update public.caja
    set saldo_usd = coalesce(saldo_usd, 0) - p_monto
    where kiosco_id = v_kiosco_id;

    insert into public.caja_move_detail (kiosco_id, saldo_pesos, saldo_usd, move_type, vendedor_id)
    values (v_kiosco_id, 0, p_monto, 'out', p_vendedor_id);
  end if;

  return public.caja_obtener_saldos();
end;
$$;

-- caja_listar_movimientos con vendedor
drop function if exists public.caja_listar_movimientos();

create or replace function public.caja_listar_movimientos()
returns setof jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', c.id,
    'saldoPesos', c.saldo_pesos,
    'saldoUsd', c.saldo_usd,
    'moveType', c.move_type,
    'createdAt', c.created_at,
    'updatedAt', c.updated_at,
    'vendedorId', c.vendedor_id,
    'vendedor',
      case
        when v.id is null then null
        else jsonb_build_object('id', v.id, 'nombre', v.nombre)
      end
  )
  from public.caja_move_detail c
  left join public.vendedor v on v.id = c.vendedor_id
  where c.kiosco_id = public.current_kiosco_id()
  order by c.created_at desc, c.id desc;
$$;
