-- Reemplaza pendiente_cobrar con venta_pendientes_cobrar:
-- acepta múltiples métodos de pago y pago parcial (el resto queda pendiente automáticamente).
drop function if exists public.pendiente_cobrar(bigint, text, integer);

create or replace function public.venta_pendientes_cobrar(
  p_venta_id bigint,
  p_nuevos_pagos jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total_pendiente   numeric(10, 2);
  v_metodo_pendiente  text;
  v_total_nuevos      numeric(10, 2) := 0;
  v_pago              jsonb;
  v_metodo_id         text;
  v_metodo_tipo       text;
  v_monto             numeric(10, 2);
  v_cuotas            integer;
  v_total_efectivo    numeric(10, 2) := 0;
  v_total_usd         numeric(10, 2) := 0;
  v_restante          numeric(10, 2);
begin
  select coalesce(sum(vp.monto), 0), min(vp.metodo_id)
  into v_total_pendiente, v_metodo_pendiente
  from public.venta_pago vp
  join public.metodo_pago mp on mp.id = vp.metodo_id
  where vp.venta_id = p_venta_id
    and mp.tipo = 'pendiente';

  if v_total_pendiente = 0 then
    raise exception 'Esta venta no tiene pagos pendientes';
  end if;

  if jsonb_typeof(p_nuevos_pagos) <> 'array' or jsonb_array_length(p_nuevos_pagos) = 0 then
    raise exception 'Debe indicar al menos un método de pago';
  end if;

  for v_pago in select * from jsonb_array_elements(p_nuevos_pagos)
  loop
    v_monto := coalesce((v_pago ->> 'monto')::numeric, 0);
    if v_monto <= 0 then
      raise exception 'El monto de cada pago debe ser mayor a 0';
    end if;
    v_total_nuevos := v_total_nuevos + v_monto;
  end loop;

  if round(v_total_nuevos, 2) > round(v_total_pendiente, 2) then
    raise exception 'El total ingresado (%) supera el monto pendiente (%)', v_total_nuevos, v_total_pendiente;
  end if;

  -- Validar que todos los métodos existan antes de modificar nada
  for v_pago in select * from jsonb_array_elements(p_nuevos_pagos)
  loop
    v_metodo_id := upper(btrim(coalesce(v_pago ->> 'metodoId', '')));
    if v_metodo_id = '' then
      raise exception 'Hay un método de pago sin ID';
    end if;
    if not exists (
      select 1 from public.metodo_pago where id = v_metodo_id and deleted = false
    ) then
      raise exception 'Método de pago no encontrado: %', v_metodo_id;
    end if;
  end loop;

  -- Borrar todos los pagos pendientes actuales de la venta
  delete from public.venta_pago
  where venta_id = p_venta_id
    and metodo_id in (
      select id from public.metodo_pago where tipo = 'pendiente'
    );

  -- Insertar los nuevos pagos
  for v_pago in select * from jsonb_array_elements(p_nuevos_pagos)
  loop
    v_metodo_id := upper(btrim(v_pago ->> 'metodoId'));
    v_monto     := (v_pago ->> 'monto')::numeric;
    v_cuotas    := nullif(v_pago ->> 'cuotas', '')::integer;

    select tipo into v_metodo_tipo
    from public.metodo_pago
    where id = v_metodo_id;

    insert into public.venta_pago (venta_id, metodo_id, monto, cuotas)
    values (p_venta_id, v_metodo_id, v_monto, v_cuotas);

    if lower(v_metodo_tipo) = 'efectivo' then
      v_total_efectivo := v_total_efectivo + v_monto;
    elsif lower(v_metodo_tipo) = 'usd' then
      v_total_usd := v_total_usd + v_monto;
    end if;
  end loop;

  -- Si es pago parcial, re-insertar el restante como pendiente
  v_restante := round(v_total_pendiente - v_total_nuevos, 2);
  if v_restante > 0 then
    insert into public.venta_pago (venta_id, metodo_id, monto, cuotas)
    values (p_venta_id, v_metodo_pendiente, v_restante, null);
  end if;

  if v_total_efectivo > 0 then
    perform public.caja_aumentar_saldo('pesos', v_total_efectivo);
  end if;
  if v_total_usd > 0 then
    perform public.caja_aumentar_saldo('usd', v_total_usd);
  end if;

  return public.ventas_detalle(p_venta_id);
end;
$$;
