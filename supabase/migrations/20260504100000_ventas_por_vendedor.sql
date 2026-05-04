create or replace function public.ventas_por_vendedor(
  p_from timestamptz default null,
  p_to   timestamptz default null
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
        'vendedor_id', rows.vendedor_id,
        'nombre',      rows.nombre,
        'total',       rows.total,
        'cantidad',    rows.cantidad
      )
      order by rows.total desc
    ),
    '[]'::jsonb
  )
  from (
    select
      v.vendedor_id,
      coalesce(vnd.nombre, 'Sin vendedor') as nombre,
      sum(v.total)                          as total,
      count(v.id)                           as cantidad
    from public.venta v
    left join public.vendedor vnd on vnd.id = v.vendedor_id
    where v.deleted = false
      and v.kiosco_id = public.current_kiosco_id()
      and (p_from is null or v.fecha >= p_from)
      and (p_to   is null or v.fecha <  (p_to + interval '1 day'))
    group by v.vendedor_id, vnd.nombre
  ) rows;
$$;
