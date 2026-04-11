create table if not exists public.kioscos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  owner_auth_id uuid null unique,
  created_at timestamptz not null default now()
);

alter table public.kioscos enable row level security;

insert into public.kioscos (id, nombre)
values ('00000000-0000-0000-0000-000000000001', 'Kiosco Demo')
on conflict (id) do nothing;

alter table public.users
  add column if not exists kiosco_id uuid references public.kioscos(id),
  add column if not exists role text not null default 'owner';

update public.users
set kiosco_id = '00000000-0000-0000-0000-000000000001'
where kiosco_id is null;

alter table public.users
  alter column kiosco_id set not null;

create or replace function public.current_kiosco_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select u.kiosco_id
  from public.users u
  where u.auth_id = auth.uid()::text
    and coalesce(u.deleted, false) = false
  limit 1;
$$;

create or replace function public.mi_perfil()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select jsonb_build_object(
    'id', u.id,
    'name', u.name,
    'email', u.email,
    'authId', u.auth_id,
    'paymenthDate', u.paymenth_date,
    'vencDate', u.venc_date,
    'kioscoId', k.id,
    'kioscoNombre', k.nombre
  )
  from public.users u
  join public.kioscos k on k.id = u.kiosco_id
  where u.auth_id = auth.uid()::text
    and coalesce(u.deleted, false) = false
  limit 1;
$$;

grant execute on function public.current_kiosco_id() to authenticated;
grant execute on function public.mi_perfil() to authenticated;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_kiosco_id uuid;
  v_kiosco_nombre text;
  v_nombre text;
begin
  v_kiosco_nombre := nullif(trim(coalesce(new.raw_user_meta_data->>'kiosco_nombre', '')), '');
  v_nombre := nullif(trim(coalesce(new.raw_user_meta_data->>'nombre', '')), '');

  if v_kiosco_nombre is null then
    v_kiosco_nombre := 'Mi Kiosco';
  end if;

  if v_nombre is null then
    v_nombre := split_part(coalesce(new.email, 'Usuario'), '@', 1);
  end if;

  insert into public.kioscos (nombre, owner_auth_id)
  values (v_kiosco_nombre, new.id)
  returning id into v_kiosco_id;

  insert into public.users (
    name,
    email,
    auth_id,
    kiosco_id,
    paymenth_date,
    venc_date,
    deleted
  )
  values (
    v_nombre,
    coalesce(new.email, ''),
    new.id::text,
    v_kiosco_id,
    now(),
    now() + interval '3650 days',
    false
  )
  on conflict (auth_id) do update
  set
    email = excluded.email,
    name = excluded.name,
    kiosco_id = excluded.kiosco_id;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

alter table public.producto add column if not exists kiosco_id uuid;
alter table public.cliente add column if not exists kiosco_id uuid;
alter table public.vendedor add column if not exists kiosco_id uuid;
alter table public.metodo_pago add column if not exists kiosco_id uuid;
alter table public.item_venta add column if not exists kiosco_id uuid;
alter table public.venta add column if not exists kiosco_id uuid;
alter table public.venta_detalle add column if not exists kiosco_id uuid;
alter table public.venta_pago add column if not exists kiosco_id uuid;
alter table public.caja add column if not exists kiosco_id uuid;
alter table public.caja_move_detail add column if not exists kiosco_id uuid;
alter table public.horario add column if not exists kiosco_id uuid;
alter table public.movimiento_stock add column if not exists kiosco_id uuid;
alter table public.ingredientes add column if not exists kiosco_id uuid;
alter table public.platos_ingredientes add column if not exists kiosco_id uuid;
alter table public.platos_subplatos add column if not exists kiosco_id uuid;

update public.producto set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.cliente set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.vendedor set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.metodo_pago set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.item_venta set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.venta set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.venta_detalle set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.venta_pago set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.caja set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.caja_move_detail set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.horario set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.movimiento_stock set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.ingredientes set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.platos_ingredientes set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;
update public.platos_subplatos set kiosco_id = '00000000-0000-0000-0000-000000000001' where kiosco_id is null;

update public.caja
set id = kiosco_id::text
where id = 'main';

alter table public.producto alter column kiosco_id set default public.current_kiosco_id();
alter table public.cliente alter column kiosco_id set default public.current_kiosco_id();
alter table public.vendedor alter column kiosco_id set default public.current_kiosco_id();
alter table public.metodo_pago alter column kiosco_id set default public.current_kiosco_id();
alter table public.item_venta alter column kiosco_id set default public.current_kiosco_id();
alter table public.venta alter column kiosco_id set default public.current_kiosco_id();
alter table public.venta_detalle alter column kiosco_id set default public.current_kiosco_id();
alter table public.venta_pago alter column kiosco_id set default public.current_kiosco_id();
alter table public.caja alter column kiosco_id set default public.current_kiosco_id();
alter table public.caja alter column id set default (public.current_kiosco_id())::text;
alter table public.caja_move_detail alter column kiosco_id set default public.current_kiosco_id();
alter table public.horario alter column kiosco_id set default public.current_kiosco_id();
alter table public.movimiento_stock alter column kiosco_id set default public.current_kiosco_id();
alter table public.ingredientes alter column kiosco_id set default public.current_kiosco_id();
alter table public.platos_ingredientes alter column kiosco_id set default public.current_kiosco_id();
alter table public.platos_subplatos alter column kiosco_id set default public.current_kiosco_id();

alter table public.producto alter column kiosco_id set not null;
alter table public.cliente alter column kiosco_id set not null;
alter table public.vendedor alter column kiosco_id set not null;
alter table public.metodo_pago alter column kiosco_id set not null;
alter table public.item_venta alter column kiosco_id set not null;
alter table public.venta alter column kiosco_id set not null;
alter table public.venta_detalle alter column kiosco_id set not null;
alter table public.venta_pago alter column kiosco_id set not null;
alter table public.caja alter column kiosco_id set not null;
alter table public.caja_move_detail alter column kiosco_id set not null;
alter table public.horario alter column kiosco_id set not null;
alter table public.movimiento_stock alter column kiosco_id set not null;
alter table public.ingredientes alter column kiosco_id set not null;
alter table public.platos_ingredientes alter column kiosco_id set not null;
alter table public.platos_subplatos alter column kiosco_id set not null;

do $$
begin
  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'producto'
      and constraint_name = 'producto_codigo_key'
  ) then
    alter table public.producto drop constraint producto_codigo_key;
  end if;

  if exists (
    select 1
    from information_schema.table_constraints
    where table_schema = 'public'
      and table_name = 'ingredientes'
      and constraint_name = 'ingredientes_codigo_key'
  ) then
    alter table public.ingredientes drop constraint ingredientes_codigo_key;
  end if;
end $$;

create unique index if not exists producto_kiosco_codigo_uidx
  on public.producto (kiosco_id, codigo);

create unique index if not exists ingredientes_kiosco_codigo_uidx
  on public.ingredientes (kiosco_id, codigo);

create unique index if not exists caja_kiosco_uidx
  on public.caja (kiosco_id);

drop policy if exists "bootstrap_all_producto" on public.producto;
drop policy if exists "bootstrap_all_cliente" on public.cliente;
drop policy if exists "bootstrap_all_vendedor" on public.vendedor;
drop policy if exists "bootstrap_all_metodo_pago" on public.metodo_pago;
drop policy if exists "bootstrap_all_item_venta" on public.item_venta;
drop policy if exists "bootstrap_all_venta" on public.venta;
drop policy if exists "bootstrap_all_venta_detalle" on public.venta_detalle;
drop policy if exists "bootstrap_all_venta_pago" on public.venta_pago;
drop policy if exists "bootstrap_all_caja" on public.caja;
drop policy if exists "bootstrap_all_caja_move_detail" on public.caja_move_detail;
drop policy if exists "bootstrap_all_horario" on public.horario;
drop policy if exists "bootstrap_all_movimiento_stock" on public.movimiento_stock;
drop policy if exists "bootstrap_all_users" on public.users;
drop policy if exists "bootstrap_all_ingredientes" on public.ingredientes;
drop policy if exists "bootstrap_allow_all_platos_ingredientes" on public.platos_ingredientes;
drop policy if exists "bootstrap_allow_all_platos_subplatos" on public.platos_subplatos;

create policy "tenant_kioscos_select"
  on public.kioscos for select
  to authenticated
  using (id = public.current_kiosco_id());

create policy "tenant_kioscos_update"
  on public.kioscos for update
  to authenticated
  using (id = public.current_kiosco_id())
  with check (id = public.current_kiosco_id());

create policy "tenant_users_all"
  on public.users for all
  to authenticated
  using (kiosco_id = public.current_kiosco_id())
  with check (kiosco_id = public.current_kiosco_id());

do $$
declare
  t text;
begin
  foreach t in array array[
    'producto',
    'cliente',
    'vendedor',
    'metodo_pago',
    'item_venta',
    'venta',
    'venta_detalle',
    'venta_pago',
    'caja',
    'caja_move_detail',
    'horario',
    'movimiento_stock',
    'ingredientes',
    'platos_ingredientes',
    'platos_subplatos'
  ]
  loop
    execute format('drop policy if exists tenant_isolation on public.%I', t);
    execute format(
      'create policy tenant_isolation on public.%I for all to authenticated using (kiosco_id = public.current_kiosco_id()) with check (kiosco_id = public.current_kiosco_id())',
      t
    );
  end loop;
end $$;

create or replace function public.ensure_caja_exists()
returns void
language plpgsql
as $$
declare
  v_kiosco_id uuid;
begin
  v_kiosco_id := public.current_kiosco_id();
  if v_kiosco_id is null then
    raise exception 'No se pudo resolver el kiosco actual';
  end if;

  insert into public.caja (id, kiosco_id, saldo_pesos, saldo_usd)
  values (v_kiosco_id::text, v_kiosco_id, 0, 0)
  on conflict (id) do nothing;
end;
$$;

create or replace function public.caja_obtener_saldos()
returns jsonb
language plpgsql
as $$
declare
  v_caja public.caja%rowtype;
  v_kiosco_id uuid;
begin
  v_kiosco_id := public.current_kiosco_id();
  perform public.ensure_caja_exists();

  select *
  into v_caja
  from public.caja
  where kiosco_id = v_kiosco_id;

  return jsonb_build_object(
    'pesos', coalesce(v_caja.saldo_pesos, 0),
    'usd', coalesce(v_caja.saldo_usd, 0)
  );
end;
$$;

create or replace function public.caja_aumentar_saldo(p_moneda text, p_monto numeric)
returns jsonb
language plpgsql
as $$
declare
  v_caja public.caja%rowtype;
  v_kiosco_id uuid;
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if p_moneda not in ('pesos', 'usd') then
    raise exception 'Moneda invalida: %', p_moneda;
  end if;

  v_kiosco_id := public.current_kiosco_id();
  perform public.ensure_caja_exists();

  select *
  into v_caja
  from public.caja
  where kiosco_id = v_kiosco_id
  for update;

  if p_moneda = 'pesos' then
    update public.caja
    set saldo_pesos = coalesce(saldo_pesos, 0) + p_monto
    where kiosco_id = v_kiosco_id;

    insert into public.caja_move_detail (kiosco_id, saldo_pesos, saldo_usd, move_type)
    values (v_kiosco_id, p_monto, 0, 'in');
  else
    update public.caja
    set saldo_usd = coalesce(saldo_usd, 0) + p_monto
    where kiosco_id = v_kiosco_id;

    insert into public.caja_move_detail (kiosco_id, saldo_pesos, saldo_usd, move_type)
    values (v_kiosco_id, 0, p_monto, 'in');
  end if;

  return public.caja_obtener_saldos();
end;
$$;

create or replace function public.caja_disminuir_saldo(p_moneda text, p_monto numeric)
returns jsonb
language plpgsql
as $$
declare
  v_caja public.caja%rowtype;
  v_kiosco_id uuid;
begin
  if p_monto is null or p_monto <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if p_moneda not in ('pesos', 'usd') then
    raise exception 'Moneda invalida: %', p_moneda;
  end if;

  v_kiosco_id := public.current_kiosco_id();
  perform public.ensure_caja_exists();

  select *
  into v_caja
  from public.caja
  where kiosco_id = v_kiosco_id
  for update;

  if p_moneda = 'pesos' then
    if coalesce(v_caja.saldo_pesos, 0) < p_monto then
      raise exception 'Saldo insuficiente en pesos';
    end if;

    update public.caja
    set saldo_pesos = coalesce(saldo_pesos, 0) - p_monto
    where kiosco_id = v_kiosco_id;

    insert into public.caja_move_detail (kiosco_id, saldo_pesos, saldo_usd, move_type)
    values (v_kiosco_id, p_monto, 0, 'out');
  else
    if coalesce(v_caja.saldo_usd, 0) < p_monto then
      raise exception 'Saldo insuficiente en usd';
    end if;

    update public.caja
    set saldo_usd = coalesce(saldo_usd, 0) - p_monto
    where kiosco_id = v_kiosco_id;

    insert into public.caja_move_detail (kiosco_id, saldo_pesos, saldo_usd, move_type)
    values (v_kiosco_id, 0, p_monto, 'out');
  end if;

  return public.caja_obtener_saldos();
end;
$$;

drop function if exists public.caja_listar_movimientos();

create or replace function public.caja_listar_movimientos()
returns setof jsonb
language sql
stable
as $$
  select jsonb_build_object(
    'id', c.id,
    'saldoPesos', c.saldo_pesos,
    'saldoUsd', c.saldo_usd,
    'moveType', c.move_type,
    'createdAt', c.created_at,
    'updatedAt', c.updated_at
  )
  from public.caja_move_detail c
  where c.kiosco_id = public.current_kiosco_id()
  order by c.created_at desc, c.id desc;
$$;
