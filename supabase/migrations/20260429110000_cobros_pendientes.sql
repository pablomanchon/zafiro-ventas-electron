create or replace function public.pendientes_listar()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', v.id,
        'fecha', v.fecha,
        'total', v.total,
        'cliente', jsonb_build_object(
          'id', c.id,
          'nombre', c.nombre,
          'apellido', c.apellido
        ),
        'vendedor', case
          when ven.id is null then null
          else jsonb_build_object('id', ven.id, 'nombre', ven.nombre)
        end,
        'pagosPendientes', (
          select jsonb_agg(
            jsonb_build_object(
              'id', vp.id,
              'monto', vp.monto,
              'metodo', jsonb_build_object(
                'id', mp.id,
                'nombre', mp.nombre,
                'tipo', mp.tipo
              )
            )
            order by vp.id
          )
          from public.venta_pago vp
          join public.metodo_pago mp on mp.id = vp.metodo_id
          where vp.venta_id = v.id
            and mp.tipo = 'pendiente'
        )
      )
      order by v.fecha asc
    ),
    '[]'::jsonb
  )
  from public.venta v
  join public.cliente c on c.id = v.cliente_id
  left join public.vendedor ven on ven.id = v.vendedor_id
  where v.deleted = false
    and c.deleted = false
    and exists (
      select 1
      from public.venta_pago vp2
      join public.metodo_pago mp2 on mp2.id = vp2.metodo_id
      where vp2.venta_id = v.id
        and mp2.tipo = 'pendiente'
    );
$$;

create or replace function public.pendiente_cobrar(
  p_pago_id bigint,
  p_nuevo_metodo_id text,
  p_cuotas integer default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_metodo_actual_tipo text;
  v_nuevo_metodo_tipo text;
  v_monto numeric(10, 2);
  v_venta_id bigint;
begin
  select mp.tipo, vp.monto, vp.venta_id
  into v_metodo_actual_tipo, v_monto, v_venta_id
  from public.venta_pago vp
  join public.metodo_pago mp on mp.id = vp.metodo_id
  where vp.id = p_pago_id;

  if v_metodo_actual_tipo is null then
    raise exception 'Pago no encontrado';
  end if;

  if v_metodo_actual_tipo <> 'pendiente' then
    raise exception 'Este pago ya fue cobrado';
  end if;

  select tipo into v_nuevo_metodo_tipo
  from public.metodo_pago
  where id = upper(btrim(p_nuevo_metodo_id))
    and deleted = false;

  if v_nuevo_metodo_tipo is null then
    raise exception 'Metodo de pago no encontrado: %', p_nuevo_metodo_id;
  end if;

  if v_nuevo_metodo_tipo = 'pendiente' then
    raise exception 'Debe seleccionar un metodo de pago distinto a Pendiente';
  end if;

  update public.venta_pago
  set metodo_id = upper(btrim(p_nuevo_metodo_id)),
      cuotas = p_cuotas
  where id = p_pago_id;

  if v_nuevo_metodo_tipo = 'efectivo' then
    perform public.caja_aumentar_saldo('pesos', v_monto);
  elsif v_nuevo_metodo_tipo = 'usd' then
    perform public.caja_aumentar_saldo('usd', v_monto);
  end if;

  return public.ventas_detalle(v_venta_id);
end;
$$;
