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
    and v.kiosco_id = public.current_kiosco_id()
    and exists (
      select 1
      from public.venta_pago vp2
      join public.metodo_pago mp2 on mp2.id = vp2.metodo_id
      where vp2.venta_id = v.id
        and mp2.tipo = 'pendiente'
    );
$$;
