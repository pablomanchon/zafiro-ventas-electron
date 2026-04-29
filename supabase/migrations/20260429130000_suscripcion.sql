create table if not exists public.suscripcion_pago (
  id          bigint generated always as identity primary key,
  kiosco_id   uuid not null references public.kioscos(id),
  plan        text not null check (plan in ('mensual', 'anual')),
  monto       numeric(10, 2) not null,
  mp_preference_id text,
  mp_payment_id    text,
  estado      text not null default 'pendiente'
              check (estado in ('pendiente', 'en_proceso', 'aprobado', 'rechazado')),
  created_at  timestamptz not null default now(),
  aprobado_at timestamptz
);

alter table public.suscripcion_pago enable row level security;

create policy "suscripcion_pago_select"
  on public.suscripcion_pago for select
  to authenticated
  using (kiosco_id = public.current_kiosco_id());

create policy "suscripcion_pago_insert"
  on public.suscripcion_pago for insert
  to authenticated
  with check (kiosco_id = public.current_kiosco_id());
