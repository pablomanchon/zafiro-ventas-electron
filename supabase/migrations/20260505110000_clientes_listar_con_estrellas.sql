create or replace function public.clientes_listar()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with totales as (
    select
      v.cliente_id,
      sum(v.total) as total_comprado
    from public.venta v
    where v.deleted = false
      and v.kiosco_id = public.current_kiosco_id()
    group by v.cliente_id
  ),
  max_total as (
    select coalesce(max(total_comprado), 0) as max_val from totales
  ),
  clientes_con_estrellas as (
    select
      c.id,
      jsonb_build_object(
        'id',        c.id,
        'nombre',    c.nombre,
        'apellido',  c.apellido,
        'email',     c.email,
        'telefono',  c.telefono,
        'direccion', c.direccion,
        'dni',       c.dni,
        'deleted',   c.deleted,
        'estrellas', case
          when coalesce(t.total_comprado, 0) = 0 then 0
          when mx.max_val = 0                    then 0
          else greatest(1, ceil(5.0 * t.total_comprado / mx.max_val))::int
        end
      ) as data
    from public.cliente c
    left join totales t on t.cliente_id = c.id
    cross join max_total mx
    where c.kiosco_id = public.current_kiosco_id()
      and c.deleted = false
  )
  select coalesce(
    jsonb_agg(data order by id asc),
    '[]'::jsonb
  )
  from clientes_con_estrellas;
$$;

grant execute on function public.clientes_listar() to authenticated;
