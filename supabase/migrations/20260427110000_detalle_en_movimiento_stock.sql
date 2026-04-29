-- Agregar campo detalle a movimiento_stock

alter table public.movimiento_stock
  add column if not exists detalle text null;

-- movimiento_stock_to_json con detalle
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
    'detalle', m.detalle,
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

-- movimiento_stock_crear con detalle opcional en el payload
create or replace function public.movimiento_stock_crear(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_move_type     text;
  v_products      jsonb;
  v_item          jsonb;
  v_codigo        text;
  v_qty           numeric;
  v_stock         integer;
  v_producto_id   bigint;
  v_movimiento_id bigint;
  v_kiosco_id     uuid;
  v_vendedor_id   bigint;
  v_detalle       text;
begin
  v_kiosco_id   := public.current_kiosco_id();
  v_move_type   := payload ->> 'moveType';
  v_products    := coalesce(payload -> 'products', '[]'::jsonb);
  v_vendedor_id := nullif(payload ->> 'vendedorId', '')::bigint;
  v_detalle     := nullif(trim(coalesce(payload ->> 'detalle', '')), '');

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

  insert into public.movimiento_stock (products_move_stock, move_type, deleted, kiosco_id, vendedor_id, detalle)
  values (v_products, v_move_type, false, v_kiosco_id, v_vendedor_id, v_detalle)
  returning id into v_movimiento_id;

  return jsonb_build_object(
    'id', v_movimiento_id,
    'movimientoId', v_movimiento_id,
    'message', format('Movimiento %s aplicado', case when v_move_type = 'in' then 'entrada' else 'salida' end),
    'totalProductos', jsonb_array_length(v_products)
  );
end;
$$;
