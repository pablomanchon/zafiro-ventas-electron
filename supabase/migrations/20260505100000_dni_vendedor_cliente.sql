alter table public.vendedor
  add column if not exists dni text;

alter table public.cliente
  add column if not exists dni text;
