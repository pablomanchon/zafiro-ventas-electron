-- Configuración: perfil del negocio y alertas de stock mínimo

alter table public.kioscos add column if not exists telefono text;
alter table public.kioscos add column if not exists direccion text;

alter table public.producto add column if not exists stock_minimo integer not null default 0;

-- Obtener perfil del kiosco
create or replace function public.kiosco_obtener()
returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id', k.id,
    'nombre', k.nombre,
    'telefono', k.telefono,
    'direccion', k.direccion
  )
  from public.kioscos k
  where k.id = public.current_kiosco_id();
$$;

-- Actualizar perfil del kiosco
create or replace function public.kiosco_actualizar(
  p_nombre text,
  p_telefono text default null,
  p_direccion text default null
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if nullif(trim(p_nombre), '') is null then
    raise exception 'El nombre no puede estar vacío';
  end if;
  update public.kioscos
  set
    nombre    = trim(p_nombre),
    telefono  = nullif(trim(coalesce(p_telefono, '')), ''),
    direccion = nullif(trim(coalesce(p_direccion, '')), '')
  where id = public.current_kiosco_id();
end;
$$;

-- Listar productos con su stock_minimo
create or replace function public.productos_stock_minimos_listar()
returns setof jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'id',          p.id,
    'nombre',      p.nombre,
    'codigo',      p.codigo,
    'stock',       coalesce(p.stock, 0),
    'stockMinimo', coalesce(p.stock_minimo, 0),
    'bajoDemanda', coalesce(p.stock_minimo, 0) > 0 and coalesce(p.stock, 0) <= coalesce(p.stock_minimo, 0)
  )
  from public.producto p
  where p.kiosco_id = public.current_kiosco_id()
    and coalesce(p.deleted, false) = false
  order by p.nombre;
$$;

-- Guardar stock_minimo de un producto
create or replace function public.producto_stock_minimo_guardar(
  p_id bigint,
  p_stock_minimo integer
)
returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_stock_minimo < 0 then
    raise exception 'El stock mínimo no puede ser negativo';
  end if;
  update public.producto
  set stock_minimo = p_stock_minimo
  where id = p_id
    and kiosco_id = public.current_kiosco_id();
end;
$$;

grant execute on function public.kiosco_obtener() to authenticated;
grant execute on function public.kiosco_actualizar(text, text, text) to authenticated;
grant execute on function public.productos_stock_minimos_listar() to authenticated;
grant execute on function public.producto_stock_minimo_guardar(bigint, integer) to authenticated;
