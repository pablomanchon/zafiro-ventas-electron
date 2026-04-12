import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import { crearHorario, getHorarios, marcarEgresoHorario } from '../../api/db'

export type Vendedor = {
  id: number
  nombre: string
}

export type Horario = {
  id: number
  horaIngreso: string
  horaEgreso: string | null
  vendedor: Vendedor | null
}

type CreateHorarioDto = {
  vendedorId: number
  horaIngreso?: string | Date
}

type MarcarEgresoDto = {
  horaEgreso?: string | Date
}

function toIso(v?: string | Date) {
  if (!v) return undefined
  if (v instanceof Date) return v.toISOString()

  const parsed = new Date(v)
  if (Number.isNaN(parsed.getTime())) return v
  return parsed.toISOString()
}

const MS_HOUR = 1000 * 60 * 60

function safeDate(iso: string) {
  const d = new Date(iso)
  return Number.isNaN(d.getTime()) ? null : d
}

function startOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

function endOfDayLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

function startOfWeekMondayLocal(d: Date) {
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  const base = new Date(d.getFullYear(), d.getMonth(), d.getDate() + diff)
  return startOfDayLocal(base)
}

function endOfWeekMondayLocal(d: Date) {
  const start = startOfWeekMondayLocal(d)
  return new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + 6,
    23,
    59,
    59,
    999
  )
}

function startOfMonthLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0)
}

function endOfMonthLocal(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
}

function overlapsRange(h: Horario, from: Date, to: Date, now = new Date()) {
  const a = safeDate(h.horaIngreso)
  if (!a) return false
  const b = h.horaEgreso ? safeDate(h.horaEgreso) : now
  if (!b) return false
  return a.getTime() <= to.getTime() && b.getTime() >= from.getTime()
}

function sumHoursInRange(
  horarios: Horario[],
  from: Date,
  to: Date,
  vendedorId?: number,
  now = new Date()
) {
  let totalMs = 0

  for (const h of horarios) {
    if (vendedorId != null && h.vendedor?.id !== vendedorId) continue
    if (!overlapsRange(h, from, to, now)) continue

    const inD = safeDate(h.horaIngreso)
    const outD = h.horaEgreso ? safeDate(h.horaEgreso) : now
    if (!inD || !outD) continue

    const start = Math.max(inD.getTime(), from.getTime())
    const end = Math.min(outD.getTime(), to.getTime())
    if (end > start) totalMs += end - start
  }

  return totalMs / MS_HOUR
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

export function useHorarios() {
  const [horarios, setHorarios] = useState<Horario[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true)
      const data = await getHorarios()
      setHorarios(data)
    } catch {
      // Si no hay GET no rompemos la pantalla.
    } finally {
      setLoading(false)
    }
  }, [])

  const marcarIngreso = useCallback(async (payload: CreateHorarioDto) => {
    try {
      setLoading(true)

      const horario = await crearHorario(payload.vendedorId, toIso(payload.horaIngreso))

      setHorarios((prev) => [horario, ...prev])
      toast.success('Ingreso marcado correctamente')
      return horario
    } catch (e: any) {
      toast.error(e.message || 'Error al marcar ingreso')
      throw e
    } finally {
      setLoading(false)
    }
  }, [])

  const marcarEgreso = useCallback(
    async (vendedorId: number, payload: MarcarEgresoDto = {}) => {
      const horario = await marcarEgresoHorario(vendedorId, toIso(payload.horaEgreso))

      await fetchAll()
      toast.success('Egreso marcado correctamente')
      return horario
    },
    [fetchAll]
  )

  const filterByVendedor = useCallback(
    (vendedorId?: number | null) => {
      if (!vendedorId) return horarios
      return horarios.filter((h) => h.vendedor?.id === vendedorId)
    },
    [horarios]
  )

  const getHorasDia = useCallback(
    (date: Date = new Date(), vendedorId?: number) => {
      const from = startOfDayLocal(date)
      const to = endOfDayLocal(date)
      return round2(sumHoursInRange(horarios, from, to, vendedorId))
    },
    [horarios]
  )

  const getHorasSemana = useCallback(
    (date: Date = new Date(), vendedorId?: number) => {
      const from = startOfWeekMondayLocal(date)
      const to = endOfWeekMondayLocal(date)
      return round2(sumHoursInRange(horarios, from, to, vendedorId))
    },
    [horarios]
  )

  const getHorasMes = useCallback(
    (date: Date = new Date(), vendedorId?: number) => {
      const from = startOfMonthLocal(date)
      const to = endOfMonthLocal(date)
      return round2(sumHoursInRange(horarios, from, to, vendedorId))
    },
    [horarios]
  )

  const getHorasRango = useCallback(
    (from: Date, to: Date, vendedorId?: number) => {
      return round2(sumHoursInRange(horarios, from, to, vendedorId))
    },
    [horarios]
  )

  return {
    horarios,
    loading,
    fetchAll,
    marcarIngreso,
    marcarEgreso,
    filterByVendedor,
    getHorasDia,
    getHorasSemana,
    getHorasMes,
    getHorasRango,
  }
}

