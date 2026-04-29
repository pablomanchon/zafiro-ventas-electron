create or replace function public.ventas_por_dia(
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
      jsonb_build_object('fecha', rows.fecha, 'total', rows.total)
      order by rows.fecha
    ),
    '[]'::jsonb
  )
  from (
    select
      date_trunc('day', v.fecha)::date as fecha,
      sum(v.total)                     as total
    from public.venta v
    where v.deleted = false
      and v.kiosco_id = public.current_kiosco_id()
      and (p_from is null or v.fecha >= p_from)
      and (p_to   is null or v.fecha <  (p_to + interval '1 day'))
    group by date_trunc('day', v.fecha)::date
  ) rows;
$$;
