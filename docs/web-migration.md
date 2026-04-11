# Migracion Web a Supabase

## Objetivo

Migrar la app desde:

- frontend React + Vite
- API local NestJS
- Electron

hacia:

- app web desplegable en Vercel
- Supabase como backend principal
- RPC y Edge Functions solo para la logica critica

## Estado actual del refactor

Ya se migraron los puntos de entrada del frontend para dejar de depender de `http://localhost:3000`:

- `src/renderer/api/crud.ts`
- `src/renderer/api/db.ts`
- `src/renderer/entities/horarios/useHorarios.tsx`
- `src/renderer/api/supabase.ts`
- `src/renderer/api/entity-map.ts`

Tambien quedaron listas estas migraciones SQL para Supabase:

- `supabase/migrations/20260411_120000_core_schema.sql`
- `supabase/migrations/20260411_121000_business_functions.sql`

## CRUD directo a Supabase

Estas entidades quedaron modeladas para acceso directo a tablas:

- `productos` -> `producto`
- `clientes` -> `cliente`
- `vendedores` -> `vendedor`
- `metodo-pago` -> `metodo_pago`
- `item-venta` -> `item_venta`
- `ingredientes` -> `ingredientes`
- `users` -> `users`

## RPC implementadas

Estas RPC ya quedaron escritas en SQL:

- `ventas_listar`
- `ventas_detalle`
- `ventas_crear`
- `ventas_actualizar`
- `ventas_borrar`
- `ventas_totales_por_tipo_pago`
- `ventas_productos_vendidos`
- `movimiento_stock_listar`
- `movimiento_stock_detalle`
- `movimiento_stock_crear`
- `caja_obtener_saldos`
- `caja_aumentar_saldo`
- `caja_disminuir_saldo`
- `caja_listar_movimientos`
- `horarios_listar`
- `horarios_marcar_ingreso`
- `horarios_marcar_egreso`

## RPC pendientes

Todavia faltan estas RPC para completar el modulo de gastronomia:

- `platos_listar`
- `platos_detalle`
- `platos_crear`
- `platos_actualizar`
- `platos_borrar`

## Criterio de arquitectura

CRUD directo:

- catalogos simples
- listados
- formularios basicos

RPC o Edge Functions:

- ventas con descuentos, pagos y stock
- movimientos de stock
- caja
- horarios con reglas de ingreso y egreso
- platos si incluyen composicion y costeo

## Orden recomendado

1. Ejecutar las migraciones SQL en Supabase.
2. Probar ventas, caja, horarios y movimientos de stock desde la app web.
3. Implementar `platos_*`.
4. Reemplazar eventos de Electron por realtime o por refetch controlado.
5. Eliminar codigo de Electron y Nest cuando el flujo web ya este estable.
