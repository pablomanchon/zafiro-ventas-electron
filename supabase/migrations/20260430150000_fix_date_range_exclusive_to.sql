create or replace function public.ventas_listar(
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
    jsonb_agg(sale.sale_json order by sale.fecha desc),
    '[]'::jsonb
  )
  from (
    select v.id, v.fecha, public.venta_to_json(v.id) as sale_json
    from public.venta v
    join public.cliente c on c.id = v.cliente_id and c.kiosco_id = v.kiosco_id
    where v.deleted = false
      and c.deleted = false
      and v.kiosco_id = public.current_kiosco_id()
      and (p_from is null or v.fecha >= p_from)
      and (p_to is null or v.fecha < p_to)
  ) sale;
$$;

create or replace function public.ventas_totales_por_tipo_pago(
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
      jsonb_build_object('tipo', rows.tipo, 'total', rows.total)
      order by rows.total desc
    ),
    '[]'::jsonb
  )
  from (
    select mp.tipo, coalesce(sum(vp.monto), 0) as total
    from public.venta_pago vp
    join public.venta v on v.id = vp.venta_id and v.kiosco_id = vp.kiosco_id
    join public.metodo_pago mp on mp.id = vp.metodo_id
    where v.deleted = false
      and v.kiosco_id = public.current_kiosco_id()
      and (mp.kiosco_id = v.kiosco_id or mp.kiosco_id is null)
      and (p_from is null or v.fecha >= p_from)
      and (p_to is null or v.fecha < p_to)
    group by mp.tipo
  ) rows;
$$;

create or replace function public.ventas_productos_vendidos(
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
        'nombre', rows.nombre,
        'cantidad', rows.cantidad,
        'importe', rows.importe
      )
      order by rows.cantidad desc
    ),
    '[]'::jsonb
  )
  from (
    select
      iv.nombre,
      sum(iv.cantidad) as cantidad,
      sum(iv.precio * iv.cantidad) as importe
    from public.venta_detalle vd
    join public.item_venta iv on iv.id = vd.item_id and iv.kiosco_id = vd.kiosco_id
    join public.venta v on v.id = vd.venta_id and v.kiosco_id = vd.kiosco_id
    where v.deleted = false
      and v.kiosco_id = public.current_kiosco_id()
      and (p_from is null or v.fecha >= p_from)
      and (p_to is null or v.fecha < p_to)
    group by iv.nombre
  ) rows;
$$;

create or replace function public.ventas_por_dia(
  p_from timestamptz default null,
  p_to   timestamptz default null
)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_agg(
      jsonb_build_object('fecha', rows.fecha, 'total', rows.total)
      order by rows.fecha
    ),
    '[]'::jsonb
  )
  from (
    select
      date_trunc('day', v.fecha)::date as fecha,
      sum(v.total)                     as total
    from public.venta v
    where v.deleted = false
      and v.kiosco_id = public.current_kiosco_id()
      and (p_from is null or v.fecha >= p_from)
      and (p_to   is null or v.fecha <  p_to)
    group by date_trunc('day', v.fecha)::date
  ) rows;
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
    and (p_to is null or f.created_at < p_to);
$$;
