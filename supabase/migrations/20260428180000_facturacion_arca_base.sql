alter table public.cliente
  add column if not exists documento_tipo smallint null,
  add column if not exists documento_nro text null,
  add column if not exists condicion_iva text null,
  add column if not exists razon_social text null;

alter table public.venta
  add column if not exists factura_estado text not null default 'sin_factura'
    check (factura_estado in ('sin_factura', 'pendiente', 'autorizada', 'rechazada', 'error')),
  add column if not exists factura_id uuid null;

create table if not exists public.kiosco_facturacion_config (
  kiosco_id uuid primary key references public.kioscos(id) on delete cascade,
  cuit text null,
  razon_social text null,
  condicion_fiscal text null,
  punto_venta integer null,
  comprobante_tipo_default integer null,
  concepto_default integer not null default 1,
  moneda_id text not null default 'PES',
  moneda_cotizacion numeric(12, 6) not null default 1,
  facturacion_modo text not null default 'manual'
    check (facturacion_modo in ('desactivada', 'manual', 'automatica')),
  arca_ambiente text not null default 'homologacion'
    check (arca_ambiente in ('homologacion', 'produccion')),
  arca_habilitado boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.arca_credenciales (
  id uuid primary key default gen_random_uuid(),
  kiosco_id uuid not null references public.kioscos(id) on delete cascade,
  ambiente text not null check (ambiente in ('homologacion', 'produccion')),
  certificado_storage_path text not null,
  private_key_storage_path text not null,
  private_key_passphrase_secret_name text null,
  activo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'arca-credenciales',
  'arca-credenciales',
  false,
  1048576,
  array[
    'application/x-pem-file',
    'application/octet-stream',
    'text/plain'
  ]
)
on conflict (id) do update
set
  public = false,
  file_size_limit = 1048576,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.factura (
  id uuid primary key default gen_random_uuid(),
  kiosco_id uuid not null references public.kioscos(id) on delete cascade,
  venta_id bigint not null references public.venta(id) on delete restrict,
  ambiente text not null check (ambiente in ('homologacion', 'produccion')),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'autorizada', 'rechazada', 'error')),
  cuit_emisor text not null,
  punto_venta integer not null,
  comprobante_tipo integer not null,
  comprobante_nro bigint null,
  concepto integer not null default 1,
  documento_tipo smallint null,
  documento_nro text null,
  moneda_id text not null default 'PES',
  moneda_cotizacion numeric(12, 6) not null default 1,
  importe_neto numeric(12, 2) not null default 0,
  importe_iva numeric(12, 2) not null default 0,
  importe_total numeric(12, 2) not null default 0,
  cae text null,
  cae_vencimiento date null,
  arca_observaciones jsonb not null default '[]'::jsonb,
  arca_request jsonb null,
  arca_response jsonb null,
  error_message text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kiosco_id, ambiente, punto_venta, comprobante_tipo, comprobante_nro),
  unique (kiosco_id, venta_id)
);

do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'venta'
      and constraint_name = 'venta_factura_id_fkey'
  ) then
    alter table public.venta
      add constraint venta_factura_id_fkey
      foreign key (factura_id) references public.factura(id) on delete set null;
  end if;
end $$;

create index if not exists factura_kiosco_venta_idx
  on public.factura (kiosco_id, venta_id);

create index if not exists factura_kiosco_estado_idx
  on public.factura (kiosco_id, estado, created_at desc);

create unique index if not exists arca_credenciales_activas_uidx
  on public.arca_credenciales (kiosco_id, ambiente)
  where activo = true;

drop trigger if exists trg_kiosco_facturacion_config_updated_at on public.kiosco_facturacion_config;
create trigger trg_kiosco_facturacion_config_updated_at
before update on public.kiosco_facturacion_config
for each row
execute function public.set_updated_at();

drop trigger if exists trg_arca_credenciales_updated_at on public.arca_credenciales;
create trigger trg_arca_credenciales_updated_at
before update on public.arca_credenciales
for each row
execute function public.set_updated_at();

drop trigger if exists trg_factura_updated_at on public.factura;
create trigger trg_factura_updated_at
before update on public.factura
for each row
execute function public.set_updated_at();

alter table public.kiosco_facturacion_config enable row level security;
alter table public.arca_credenciales enable row level security;
alter table public.factura enable row level security;

drop policy if exists tenant_kiosco_facturacion_config_all on public.kiosco_facturacion_config;
create policy tenant_kiosco_facturacion_config_all
  on public.kiosco_facturacion_config for all
  to authenticated
  using (kiosco_id = public.current_kiosco_id())
  with check (kiosco_id = public.current_kiosco_id());

drop policy if exists tenant_factura_select on public.factura;
create policy tenant_factura_select
  on public.factura for select
  to authenticated
  using (kiosco_id = public.current_kiosco_id());

-- No client policy is created for arca_credenciales on purpose.
-- The frontend must never read certificate/private-key locations directly.
-- Supabase Edge Functions should access this table with the service role.

create or replace function public.facturacion_configuracion_obtener()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'kioscoId', k.id,
    'kioscoNombre', k.nombre,
    'cuit', cfg.cuit,
    'razonSocial', cfg.razon_social,
    'condicionFiscal', cfg.condicion_fiscal,
    'puntoVenta', cfg.punto_venta,
    'comprobanteTipoDefault', cfg.comprobante_tipo_default,
    'conceptoDefault', coalesce(cfg.concepto_default, 1),
    'monedaId', coalesce(cfg.moneda_id, 'PES'),
    'monedaCotizacion', coalesce(cfg.moneda_cotizacion, 1),
    'facturacionModo', coalesce(cfg.facturacion_modo, 'manual'),
    'arcaAmbiente', coalesce(cfg.arca_ambiente, 'homologacion'),
    'arcaHabilitado', coalesce(cfg.arca_habilitado, false)
  )
  from public.kioscos k
  left join public.kiosco_facturacion_config cfg on cfg.kiosco_id = k.id
  where k.id = public.current_kiosco_id();
$$;

create or replace function public.facturacion_configuracion_guardar(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kiosco_id uuid;
begin
  v_kiosco_id := public.current_kiosco_id();

  if v_kiosco_id is null then
    raise exception 'No se pudo resolver el kiosco actual';
  end if;

  insert into public.kiosco_facturacion_config (
    kiosco_id,
    cuit,
    razon_social,
    condicion_fiscal,
    punto_venta,
    comprobante_tipo_default,
    concepto_default,
    moneda_id,
    moneda_cotizacion,
    facturacion_modo,
    arca_ambiente,
    arca_habilitado
  )
  values (
    v_kiosco_id,
    nullif(regexp_replace(coalesce(payload ->> 'cuit', ''), '\D', '', 'g'), ''),
    nullif(btrim(coalesce(payload ->> 'razonSocial', '')), ''),
    nullif(btrim(coalesce(payload ->> 'condicionFiscal', '')), ''),
    nullif(payload ->> 'puntoVenta', '')::integer,
    nullif(payload ->> 'comprobanteTipoDefault', '')::integer,
    coalesce(nullif(payload ->> 'conceptoDefault', '')::integer, 1),
    coalesce(nullif(upper(btrim(payload ->> 'monedaId')), ''), 'PES'),
    coalesce(nullif(payload ->> 'monedaCotizacion', '')::numeric, 1),
    coalesce(nullif(payload ->> 'facturacionModo', ''), 'manual'),
    coalesce(nullif(payload ->> 'arcaAmbiente', ''), 'homologacion'),
    coalesce((payload ->> 'arcaHabilitado')::boolean, false)
  )
  on conflict (kiosco_id) do update
  set
    cuit = excluded.cuit,
    razon_social = excluded.razon_social,
    condicion_fiscal = excluded.condicion_fiscal,
    punto_venta = excluded.punto_venta,
    comprobante_tipo_default = excluded.comprobante_tipo_default,
    concepto_default = excluded.concepto_default,
    moneda_id = excluded.moneda_id,
    moneda_cotizacion = excluded.moneda_cotizacion,
    facturacion_modo = excluded.facturacion_modo,
    arca_ambiente = excluded.arca_ambiente,
    arca_habilitado = excluded.arca_habilitado;

  return public.facturacion_configuracion_obtener();
end;
$$;

create or replace function public.facturas_listar(
  p_from timestamptz default null,
  p_to timestamptz default null
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
        'id', f.id,
        'ventaId', f.venta_id,
        'fechaVenta', v.fecha,
        'estado', f.estado,
        'ambiente', f.ambiente,
        'cuitEmisor', f.cuit_emisor,
        'puntoVenta', f.punto_venta,
        'comprobanteTipo', f.comprobante_tipo,
        'comprobanteNro', f.comprobante_nro,
        'importeTotal', f.importe_total,
        'cae', f.cae,
        'caeVencimiento', f.cae_vencimiento,
        'errorMessage', f.error_message,
        'createdAt', f.created_at
      )
      order by f.created_at desc
    ),
    '[]'::jsonb
  )
  from public.factura f
  join public.venta v on v.id = f.venta_id and v.kiosco_id = f.kiosco_id
  where f.kiosco_id = public.current_kiosco_id()
    and (p_from is null or f.created_at >= p_from)
    and (p_to is null or f.created_at < (p_to + interval '1 day'));
$$;

create or replace function public.arca_credenciales_resumen()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', c.id,
        'ambiente', c.ambiente,
        'activo', c.activo,
        'tieneCertificado', c.certificado_storage_path is not null,
        'tienePrivateKey', c.private_key_storage_path is not null,
        'tienePassphrase', c.private_key_passphrase_secret_name is not null,
        'createdAt', c.created_at,
        'updatedAt', c.updated_at
      )
      order by c.ambiente, c.created_at desc
    ),
    '[]'::jsonb
  )
  from public.arca_credenciales c
  where c.kiosco_id = public.current_kiosco_id();
$$;

create or replace function public.arca_credenciales_desactivar(p_ambiente text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kiosco_id uuid;
begin
  v_kiosco_id := public.current_kiosco_id();

  if p_ambiente not in ('homologacion', 'produccion') then
    raise exception 'Ambiente ARCA invalido';
  end if;

  update public.arca_credenciales
  set activo = false
  where kiosco_id = v_kiosco_id
    and ambiente = p_ambiente
    and activo = true;

  return public.arca_credenciales_resumen();
end;
$$;

grant execute on function public.facturacion_configuracion_obtener() to authenticated;
grant execute on function public.facturacion_configuracion_guardar(jsonb) to authenticated;
grant execute on function public.facturas_listar(timestamptz, timestamptz) to authenticated;
grant execute on function public.arca_credenciales_resumen() to authenticated;
grant execute on function public.arca_credenciales_desactivar(text) to authenticated;
