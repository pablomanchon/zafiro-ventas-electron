import { supabase } from './supabase'

function normalizeError(error: unknown): never {
  if (error instanceof Error) throw error
  if (typeof error === 'string') throw new Error(error)
  if (error && typeof error === 'object') {
    const maybe = error as Record<string, unknown>
    const message = typeof maybe.message === 'string' ? maybe.message : null
    const details = typeof maybe.details === 'string' ? maybe.details : null
    const code = typeof maybe.code === 'string' ? maybe.code : null
    const parts = [message, details, code ? `(${code})` : null].filter(Boolean)
    if (parts.length > 0) throw new Error(parts.join(' '))
  }
  throw new Error('Ocurrio un error inesperado')
}

async function runRpc<T>(fn: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.rpc(fn, args)
  if (error) return normalizeError(error)
  return data as T
}

export const baseUrl = ''

export const getAllProducts = async () => {
  const { data, error } = await supabase
    .from('producto')
    .select('*')
    .eq('deleted', false)
    .order('id', { ascending: true })

  if (error) return normalizeError(error)
  return data ?? []
}

export const getAllLotes = async () => {
  return []
}

export const getAllSaldos = async () => {
  return runRpc<{ pesos: number; usd: number }>('caja_obtener_saldos')
}

export const aumentarSaldo = async (moneda: 'pesos' | 'usd', monto: number, vendedorId?: number | null) => {
  await runRpc('caja_aumentar_saldo', { p_moneda: moneda, p_monto: monto, p_vendedor_id: vendedorId ?? null })
}

export const disminuirSaldo = async (moneda: 'pesos' | 'usd', monto: number, vendedorId?: number | null) => {
  await runRpc('caja_disminuir_saldo', { p_moneda: moneda, p_monto: monto, p_vendedor_id: vendedorId ?? null })
}

export const getMoves = async () => {
  const rows = await runRpc<Array<{ id: number; saldoPesos: string; saldoUsd: string; moveType: 'in' | 'out'; createdAt: string; updatedAt: string }>>('caja_listar_movimientos')
  return rows.map(r => ({
    id: r.id,
    moneda: Number(r.saldoPesos) > 0 ? 'pesos' : 'usd' as 'pesos' | 'usd',
    monto: Number(r.saldoPesos) > 0 ? r.saldoPesos : r.saldoUsd,
    moveType: r.moveType,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }))
}

export const getSelledProductsByDate = async (from: string, to: string) => {
  return runRpc<any[]>('ventas_productos_vendidos', { p_from: from, p_to: to })
}

export const getUser = async (id: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .eq('deleted', false)
    .single()

  if (error) return normalizeError(error)
  return data
}

export type MetodoTotal = { tipo: string; total: number }

export type VentaDia = { fecha: string; total: number }

export async function getVentasPorDia(from?: string, to?: string): Promise<VentaDia[]> {
  const rows = await runRpc<Array<{ fecha: string; total: string | number }>>(
    'ventas_por_dia',
    { p_from: from ?? null, p_to: to ?? null },
  )
  return (rows ?? []).map((r) => ({ fecha: r.fecha, total: Number(r.total) }))
}

export async function getTotalesPorTipoPago(from?: string, to?: string): Promise<MetodoTotal[]> {
  const rows = await runRpc<Array<{ tipo: string; total: string | number }>>(
    'ventas_totales_por_tipo_pago',
    { p_from: from ?? null, p_to: to ?? null },
  )

  return (rows ?? []).map((r) => ({ tipo: r.tipo, total: Number(r.total) }))
}

export type VendedorHorario = {
  id: number
  nombre: string
}

export type HorarioDto = {
  id: number
  horaIngreso: string
  horaEgreso: string | null
  vendedor: VendedorHorario | null
}

export async function getHorarios(): Promise<HorarioDto[]> {
  return runRpc<HorarioDto[]>('horarios_listar')
}

export async function crearHorario(vendedorId: number, horaIngreso?: string): Promise<HorarioDto> {
  return runRpc<HorarioDto>('horarios_marcar_ingreso', {
    p_vendedor_id: vendedorId,
    p_hora_ingreso: horaIngreso ?? null,
  })
}

export async function marcarEgresoHorario(vendedorId: number, horaEgreso?: string): Promise<HorarioDto> {
  return runRpc<HorarioDto>('horarios_marcar_egreso', {
    p_vendedor_id: vendedorId,
    p_hora_egreso: horaEgreso ?? null,
  })
}

export type VentaVendedor = {
  vendedor_id: number | null
  nombre: string
  total: number
  cantidad: number
}

export async function getVentasPorVendedor(from?: string, to?: string): Promise<VentaVendedor[]> {
  const rows = await runRpc<Array<{ vendedor_id: number | null; nombre: string; total: string | number; cantidad: string | number }>>(
    'ventas_por_vendedor',
    { p_from: from ?? null, p_to: to ?? null },
  )
  return (rows ?? []).map((r) => ({
    vendedor_id: r.vendedor_id,
    nombre: r.nombre,
    total: Number(r.total),
    cantidad: Number(r.cantidad),
  }))
}
