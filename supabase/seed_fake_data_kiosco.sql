do $$
declare
  v_kiosco uuid := 'a1362a1a-5d4d-4d79-b289-b18ab0cd957e';
  v_old_fake_pesos numeric(12, 2) := 0;
  v_old_fake_usd numeric(12, 2) := 0;
  v_new_fake_pesos numeric(12, 2) := 0;
  v_new_fake_usd numeric(12, 2) := 0;
  v_cliente_id bigint;
  v_vendedor_id bigint;
  v_producto_id bigint;
  v_producto_codigo text;
  v_producto_nombre text;
  v_producto_precio numeric(10, 2);
  v_ingrediente_id bigint;
  v_plato_id bigint;
  v_item_id bigint;
  v_venta_id bigint;
  v_qty integer;
  v_total numeric(10, 2);
  v_move_type text;
  v_pesos_amount numeric(12, 2);
  v_usd_amount numeric(12, 2);
  i integer;
begin
  insert into public.caja (id, kiosco_id, saldo_pesos, saldo_usd)
  values (v_kiosco::text, v_kiosco, 0, 0)
  on conflict (id) do nothing;

  select
    coalesce(sum(
      case
        when saldo_pesos > 0 and move_type = 'in' then saldo_pesos
        when saldo_pesos > 0 and move_type = 'out' then -saldo_pesos
        else 0
      end
    ), 0),
    coalesce(sum(
      case
        when saldo_usd > 0 and move_type = 'in' then saldo_usd
        when saldo_usd > 0 and move_type = 'out' then -saldo_usd
        else 0
      end
    ), 0)
  into v_old_fake_pesos, v_old_fake_usd
  from public.caja_move_detail
  where kiosco_id = v_kiosco
    and (
      saldo_pesos in (1111.11, 1148.11, 1185.11, 1222.11, 1259.11, 1296.11, 1333.11, 1370.11, 1407.11, 1444.11)
      or saldo_usd in (21.11, 22.48, 23.85, 25.22, 26.59, 27.96, 29.33, 30.70, 32.07, 33.44)
    );

  update public.caja
  set
    saldo_pesos = coalesce(saldo_pesos, 0) - v_old_fake_pesos,
    saldo_usd = coalesce(saldo_usd, 0) - v_old_fake_usd
  where kiosco_id = v_kiosco;

  delete from public.caja_move_detail
  where kiosco_id = v_kiosco
    and (
      saldo_pesos in (1111.11, 1148.11, 1185.11, 1222.11, 1259.11, 1296.11, 1333.11, 1370.11, 1407.11, 1444.11)
      or saldo_usd in (21.11, 22.48, 23.85, 25.22, 26.59, 27.96, 29.33, 30.70, 32.07, 33.44)
    );

  delete from public.venta
  where kiosco_id = v_kiosco
    and cliente_id in (
      select id
      from public.cliente
      where kiosco_id = v_kiosco
        and nombre like 'ZZTEST Cliente %'
    );

  delete from public.item_venta
  where kiosco_id = v_kiosco
    and codigo like 'ZZTEST-%';

  delete from public.horario
  where kiosco_id = v_kiosco
    and vendedor_id in (
      select id
      from public.vendedor
      where kiosco_id = v_kiosco
        and nombre like 'ZZTEST Vendedor %'
    );

  delete from public.movimiento_stock
  where kiosco_id = v_kiosco
    and products_move_stock::text like '%ZZTEST-%';

  delete from public.platos_subplatos
  where kiosco_id = v_kiosco
    and (
      plato_padre_id in (
        select id from public.producto where kiosco_id = v_kiosco and codigo like 'ZZTEST-PLATO-%'
      )
      or plato_hijo_id in (
        select id from public.producto where kiosco_id = v_kiosco and codigo like 'ZZTEST-PLATO-%'
      )
    );

  delete from public.platos_ingredientes
  where kiosco_id = v_kiosco
    and (
      plato_id in (
        select id from public.producto where kiosco_id = v_kiosco and codigo like 'ZZTEST-PLATO-%'
      )
      or ingrediente_id in (
        select id from public.ingredientes where kiosco_id = v_kiosco and codigo like 'ZZTEST-ING-%'
      )
    );

  delete from public.producto
  where kiosco_id = v_kiosco
    and (
      codigo like 'ZZTEST-PROD-%'
      or codigo like 'ZZTEST-PLATO-%'
    );

  delete from public.ingredientes
  where kiosco_id = v_kiosco
    and codigo like 'ZZTEST-ING-%';

  delete from public.vendedor
  where kiosco_id = v_kiosco
    and nombre like 'ZZTEST Vendedor %';

  delete from public.cliente
  where kiosco_id = v_kiosco
    and nombre like 'ZZTEST Cliente %';

  for i in 1..10 loop
    insert into public.cliente (
      nombre,
      apellido,
      email,
      telefono,
      direccion,
      deleted,
      kiosco_id
    )
    values (
      format('ZZTEST Cliente %s', lpad(i::text, 2, '0')),
      format('Apellido %s', lpad(i::text, 2, '0')),
      format('zztest.cliente.%s@example.com', lpad(i::text, 2, '0')),
      format('11-5555-%s', lpad((1000 + i)::text, 4, '0')),
      format('Calle Falsa %s', 100 + i),
      false,
      v_kiosco
    );
  end loop;

  for i in 1..10 loop
    insert into public.vendedor (nombre, deleted, kiosco_id)
    values (
      format('ZZTEST Vendedor %s', lpad(i::text, 2, '0')),
      false,
      v_kiosco
    );
  end loop;

  for i in 1..10 loop
    insert into public.ingredientes (
      nombre,
      unidad_base,
      cantidad_base,
      codigo,
      precio_costo_base,
      deleted,
      kiosco_id
    )
    values (
      format('ZZTEST Ingrediente %s', lpad(i::text, 2, '0')),
      case
        when mod(i, 3) = 1 then 'UNIDAD'
        when mod(i, 3) = 2 then 'GRAMOS'
        else 'MILILITROS'
      end,
      case
        when mod(i, 3) = 1 then 1
        when mod(i, 3) = 2 then 1000
        else 1000
      end,
      format('ZZTEST-ING-%s', lpad(i::text, 2, '0')),
      250 + (i * 35),
      false,
      v_kiosco
    );
  end loop;

  for i in 1..10 loop
    insert into public.producto (
      tipo,
      codigo,
      nombre,
      descripcion,
      precio,
      stock,
      precio_costo,
      deleted,
      kiosco_id
    )
    values (
      'PRODUCTO',
      format('ZZTEST-PROD-%s', lpad(i::text, 2, '0')),
      format('ZZTEST Producto %s', lpad(i::text, 2, '0')),
      format('Producto de prueba numero %s para testear la app', i),
      1800 + (i * 275),
      40 + (i * 3),
      900 + (i * 120),
      false,
      v_kiosco
    );
  end loop;

  for i in 1..10 loop
    select id
    into v_ingrediente_id
    from public.ingredientes
    where kiosco_id = v_kiosco
      and codigo = format('ZZTEST-ING-%s', lpad(i::text, 2, '0'));

    insert into public.producto (
      tipo,
      codigo,
      nombre,
      descripcion,
      precio,
      stock,
      precio_costo,
      deleted,
      kiosco_id
    )
    values (
      'PLATO',
      format('ZZTEST-PLATO-%s', lpad(i::text, 2, '0')),
      format('ZZTEST Plato %s', lpad(i::text, 2, '0')),
      format('Plato de prueba %s para validar cocina y ventas', i),
      4200 + (i * 210),
      12 + i,
      500 + (i * 80),
      false,
      v_kiosco
    )
    returning id into v_plato_id;

    insert into public.platos_ingredientes (
      plato_id,
      ingrediente_id,
      cantidad_usada,
      kiosco_id
    )
    values (
      v_plato_id,
      v_ingrediente_id,
      case
        when mod(i, 3) = 1 then 1
        when mod(i, 3) = 2 then 180
        else 220
      end,
      v_kiosco
    );
  end loop;

  for i in 1..10 loop
    select id, codigo, nombre
    into v_producto_id, v_producto_codigo, v_producto_nombre
    from public.producto
    where kiosco_id = v_kiosco
      and codigo = format('ZZTEST-PROD-%s', lpad(i::text, 2, '0'));

    v_move_type := case when mod(i, 2) = 0 then 'in' else 'out' end;

    insert into public.movimiento_stock (
      products_move_stock,
      fecha,
      move_type,
      deleted,
      kiosco_id
    )
    values (
      jsonb_build_array(
        jsonb_build_object(
          'idProduct', v_producto_id,
          'quantity', 1 + mod(i, 4),
          'nombre', v_producto_nombre,
          'codigo', v_producto_codigo
        )
      ),
      now() - make_interval(hours => 10 - i),
      v_move_type,
      false,
      v_kiosco
    );
  end loop;

  for i in 1..10 loop
    select id
    into v_vendedor_id
    from public.vendedor
    where kiosco_id = v_kiosco
      and nombre = format('ZZTEST Vendedor %s', lpad(i::text, 2, '0'));

    insert into public.horario (
      hora_ingreso,
      hora_egreso,
      vendedor_id,
      kiosco_id
    )
    values (
      now() - make_interval(hours => 11 - i),
      case when mod(i, 3) = 0 then null else now() - make_interval(hours => 10 - i) + interval '35 minutes' end,
      v_vendedor_id,
      v_kiosco
    );
  end loop;

  for i in 1..10 loop
    select id
    into v_cliente_id
    from public.cliente
    where kiosco_id = v_kiosco
      and nombre = format('ZZTEST Cliente %s', lpad(i::text, 2, '0'));

    select id
    into v_vendedor_id
    from public.vendedor
    where kiosco_id = v_kiosco
      and nombre = format('ZZTEST Vendedor %s', lpad(i::text, 2, '0'));

    select id, codigo, nombre, precio
    into v_producto_id, v_producto_codigo, v_producto_nombre, v_producto_precio
    from public.producto
    where kiosco_id = v_kiosco
      and codigo = format('ZZTEST-PROD-%s', lpad(i::text, 2, '0'));

    v_qty := 1 + mod(i, 3);
    v_total := round((v_producto_precio * v_qty)::numeric, 2);

    insert into public.venta (
      fecha,
      cliente_id,
      vendedor_id,
      total,
      deleted,
      kiosco_id
    )
    values (
      now() - make_interval(hours => 10 - i),
      v_cliente_id,
      v_vendedor_id,
      v_total,
      false,
      v_kiosco
    )
    returning id into v_venta_id;

    insert into public.item_venta (
      nombre,
      descripcion,
      precio,
      cantidad,
      codigo,
      kiosco_id
    )
    values (
      v_producto_nombre,
      format('Item de venta fake %s', i),
      v_producto_precio,
      v_qty,
      v_producto_codigo,
      v_kiosco
    )
    returning id into v_item_id;

    insert into public.venta_detalle (venta_id, item_id, kiosco_id)
    values (v_venta_id, v_item_id, v_kiosco);

    insert into public.venta_pago (venta_id, metodo_id, monto, cuotas, kiosco_id)
    values (
      v_venta_id,
      case when mod(i, 2) = 0 then 'DEFAULT_DEBITO' else 'DEFAULT_CREDITO' end,
      v_total,
      case when mod(i, 2) = 0 then null else 3 end,
      v_kiosco
    );
  end loop;

  for i in 1..10 loop
    if mod(i, 2) = 0 then
      v_pesos_amount := 1111.11 + ((i - 1) * 37);
      v_usd_amount := 0;
      v_move_type := 'in';
      v_new_fake_pesos := v_new_fake_pesos + v_pesos_amount;
    elsif mod(i, 5) = 0 then
      v_pesos_amount := 0;
      v_usd_amount := 21.11 + ((i - 1) * 1.37);
      v_move_type := 'out';
      v_new_fake_usd := v_new_fake_usd - v_usd_amount;
    elsif mod(i, 3) = 0 then
      v_pesos_amount := 1111.11 + ((i - 1) * 37);
      v_usd_amount := 0;
      v_move_type := 'out';
      v_new_fake_pesos := v_new_fake_pesos - v_pesos_amount;
    else
      v_pesos_amount := 0;
      v_usd_amount := 21.11 + ((i - 1) * 1.37);
      v_move_type := 'in';
      v_new_fake_usd := v_new_fake_usd + v_usd_amount;
    end if;

    insert into public.caja_move_detail (
      saldo_pesos,
      saldo_usd,
      move_type,
      created_at,
      updated_at,
      kiosco_id
    )
    values (
      v_pesos_amount,
      v_usd_amount,
      v_move_type,
      now() - make_interval(hours => 10 - i),
      now() - make_interval(hours => 10 - i),
      v_kiosco
    );
  end loop;

  update public.caja
  set
    saldo_pesos = coalesce(saldo_pesos, 0) + v_new_fake_pesos,
    saldo_usd = coalesce(saldo_usd, 0) + v_new_fake_usd
  where kiosco_id = v_kiosco;
end $$;
