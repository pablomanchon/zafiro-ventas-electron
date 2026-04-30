create or replace function public.movimiento_stock_deshacer(p_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kiosco_id   uuid;
  v_move_type   text;
  v_products    jsonb;
  v_item        jsonb;
  v_codigo      text;
  v_qty         numeric;
  v_stock       integer;
  v_producto_id bigint;
begin
  v_kiosco_id := public.current_kiosco_id();

  select move_type, products_move_stock
  into v_move_type, v_products
  from public.movimiento_stock
  where id = p_id
    and kiosco_id = v_kiosco_id
    and deleted = false;

  if not found then
    raise exception 'Movimiento no encontrado o ya fue deshecho';
  end if;

  -- Validar que el stock da para revertir antes de tocar nada
  if v_move_type = 'in' then
    for v_item in select * from jsonb_array_elements(v_products)
    loop
      v_codigo := btrim(coalesce(v_item ->> 'idProduct', ''));
      v_qty    := coalesce((v_item ->> 'quantity')::numeric, 0);

      select id, stock
      into v_producto_id, v_stock
      from public.producto
      where codigo = v_codigo
        and deleted = false
        and kiosco_id = v_kiosco_id;

      if v_producto_id is null then
        raise exception 'Producto "%" ya no existe', v_codigo;
      end if;

      if v_stock < v_qty then
        raise exception 'No se puede deshacer: el producto "%" tiene stock % pero se necesitan restar %',
          v_codigo, v_stock, v_qty;
      end if;
    end loop;
  end if;

  -- Aplicar la reversión
  for v_item in select * from jsonb_array_elements(v_products)
  loop
    v_codigo := btrim(coalesce(v_item ->> 'idProduct', ''));
    v_qty    := coalesce((v_item ->> 'quantity')::numeric, 0);

    update public.producto
    set stock = case
      when v_move_type = 'in' then stock - v_qty::integer
      else                         stock + v_qty::integer
    end
    where codigo = v_codigo
      and deleted = false
      and kiosco_id = v_kiosco_id;
  end loop;

  update public.movimiento_stock
  set deleted = true
  where id = p_id
    and kiosco_id = v_kiosco_id;

  return jsonb_build_object('ok', true, 'id', p_id);
end;
$$;
