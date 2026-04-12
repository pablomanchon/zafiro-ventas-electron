alter table public.metodo_pago
  alter column kiosco_id drop not null;

drop policy if exists tenant_isolation on public.metodo_pago;

create policy metodo_pago_select_shared_or_tenant
  on public.metodo_pago
  for select
  to authenticated
  using (
    kiosco_id is null
    or kiosco_id = public.current_kiosco_id()
  );

create policy metodo_pago_insert_tenant_only
  on public.metodo_pago
  for insert
  to authenticated
  with check (
    kiosco_id = public.current_kiosco_id()
  );

create policy metodo_pago_update_tenant_only
  on public.metodo_pago
  for update
  to authenticated
  using (
    kiosco_id = public.current_kiosco_id()
  )
  with check (
    kiosco_id = public.current_kiosco_id()
  );

create policy metodo_pago_delete_tenant_only
  on public.metodo_pago
  for delete
  to authenticated
  using (
    kiosco_id = public.current_kiosco_id()
  );

update public.metodo_pago
set deleted = true
where kiosco_id is not null
  and id in ('EFECTIVO', 'DEBITO', 'CREDITO', 'USD', 'PENDIENTE', 'OTRO');

insert into public.metodo_pago (id, nombre, tipo, deleted, kiosco_id)
values
  ('DEFAULT_EFECTIVO', 'Efectivo', 'efectivo', false, null),
  ('DEFAULT_DEBITO', 'Tarjeta de Debito', 'debito', false, null),
  ('DEFAULT_CREDITO', 'Tarjeta de Credito', 'credito', false, null),
  ('DEFAULT_USD', 'Dolares USD', 'usd', false, null),
  ('DEFAULT_PENDIENTE', 'Pendiente', 'pendiente', false, null),
  ('DEFAULT_OTRO', 'Otro', 'otro', false, null)
on conflict (id) do update
set
  nombre = excluded.nombre,
  tipo = excluded.tipo,
  deleted = false,
  kiosco_id = null;
