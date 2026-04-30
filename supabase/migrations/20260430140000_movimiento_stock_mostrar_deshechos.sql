-- Incluir movimientos deshechos en el listado (deleted = true)
-- Se muestran con el campo deleted para que el frontend los distinga visualmente.

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
  where m.kiosco_id = public.current_kiosco_id();
$$;
