create table if not exists public.arca_certificado_solicitudes (
  id uuid primary key default gen_random_uuid(),
  kiosco_id uuid not null references public.kioscos(id) on delete cascade,
  ambiente text not null check (ambiente in ('homologacion', 'produccion')),
  cuit text not null,
  organizacion text not null,
  common_name text not null default 'Zafiro',
  private_key_storage_path text not null,
  csr_storage_path text not null,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'completada', 'cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.arca_credenciales
  add column if not exists solicitud_id uuid null references public.arca_certificado_solicitudes(id) on delete set null;

create index if not exists arca_certificado_solicitudes_kiosco_idx
  on public.arca_certificado_solicitudes (kiosco_id, ambiente, estado, created_at desc);

drop trigger if exists trg_arca_certificado_solicitudes_updated_at on public.arca_certificado_solicitudes;
create trigger trg_arca_certificado_solicitudes_updated_at
before update on public.arca_certificado_solicitudes
for each row
execute function public.set_updated_at();

alter table public.arca_certificado_solicitudes enable row level security;

drop policy if exists tenant_arca_certificado_solicitudes_select on public.arca_certificado_solicitudes;
create policy tenant_arca_certificado_solicitudes_select
  on public.arca_certificado_solicitudes for select
  to authenticated
  using (kiosco_id = public.current_kiosco_id());

create or replace function public.arca_certificado_solicitudes_resumen()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', s.id,
        'ambiente', s.ambiente,
        'cuit', s.cuit,
        'organizacion', s.organizacion,
        'commonName', s.common_name,
        'estado', s.estado,
        'createdAt', s.created_at,
        'updatedAt', s.updated_at
      )
      order by s.created_at desc
    ),
    '[]'::jsonb
  )
  from public.arca_certificado_solicitudes s
  where s.kiosco_id = public.current_kiosco_id();
$$;

grant execute on function public.arca_certificado_solicitudes_resumen() to authenticated;
