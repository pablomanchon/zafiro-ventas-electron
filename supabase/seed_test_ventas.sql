DO $$
DECLARE
  k uuid := 'a1362a1a-5d4d-4d79-b289-b18ab0cd957e';
  c bigint := 2; -- Consumidor
  vid bigint;
  iid bigint;
BEGIN

  -- 1 ABR  $28.000  efectivo
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Remera básica', 14000, 2, 'SEED-001', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-01 10:30:00+00', c, 28000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_EFECTIVO', 28000, k);

  -- 3 ABR  $45.000  crédito
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Jean slim', 22500, 2, 'SEED-002', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-03 14:00:00+00', c, 45000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_CREDITO', 45000, k);

  -- 5 ABR  $12.500  débito
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Medias pack x3', 4167, 3, 'SEED-003', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-05 09:15:00+00', c, 12500, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_DEBITO', 12500, k);

  -- 7 ABR  $63.000  efectivo
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Campera invierno', 63000, 1, 'SEED-004', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-07 11:45:00+00', c, 63000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_EFECTIVO', 63000, k);

  -- 10 ABR  $38.000  USD
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Zapatillas import', 38000, 1, 'SEED-005', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-10 16:00:00+00', c, 38000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_USD', 38000, k);

  -- 12 ABR  $19.500  crédito
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Buzo hoodie', 19500, 1, 'SEED-006', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-12 13:20:00+00', c, 19500, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_CREDITO', 19500, k);

  -- 14 ABR  $55.000  efectivo
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Vestido verano', 27500, 2, 'SEED-007', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-14 10:00:00+00', c, 55000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_EFECTIVO', 55000, k);

  -- 17 ABR  $92.000  crédito
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Piloto impermeable', 46000, 2, 'SEED-008', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-17 15:30:00+00', c, 92000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_CREDITO', 92000, k);

  -- 19 ABR  $31.000  débito
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Pantalón cargo', 31000, 1, 'SEED-009', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-19 12:00:00+00', c, 31000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_DEBITO', 31000, k);

  -- 21 ABR  $74.000  efectivo
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Traje sastre', 74000, 1, 'SEED-010', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-21 17:00:00+00', c, 74000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_EFECTIVO', 74000, k);

  -- 23 ABR  $48.000  USD
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Bolso de cuero', 24000, 2, 'SEED-011', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-23 09:45:00+00', c, 48000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_USD', 48000, k);

  -- 25 ABR  $22.000  crédito
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Remera oversize', 11000, 2, 'SEED-012', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-25 14:30:00+00', c, 22000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_CREDITO', 22000, k);

  -- 27 ABR  $110.000  efectivo
  INSERT INTO public.item_venta (nombre, precio, cantidad, codigo, kiosco_id) VALUES ('Conjunto deportivo', 55000, 2, 'SEED-013', k) RETURNING id INTO iid;
  INSERT INTO public.venta (fecha, cliente_id, total, deleted, kiosco_id) VALUES ('2026-04-27 11:00:00+00', c, 110000, false, k) RETURNING id INTO vid;
  INSERT INTO public.venta_detalle (venta_id, item_id, kiosco_id) VALUES (vid, iid, k);
  INSERT INTO public.venta_pago (venta_id, metodo_id, monto, kiosco_id) VALUES (vid, 'DEFAULT_EFECTIVO', 110000, k);

END $$;
