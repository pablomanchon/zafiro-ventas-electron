// src/hooks/useHorarios.ts
import { useCallback, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { baseUrl } from '../../api/db'

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
    return v instanceof Date ? v.toISOString() : v
}

/** =========================
 *  Helpers de horas / rangos
 *  ========================= */
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
    // Lunes=1 ... Domingo=0
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

/**
 * Suma horas de horarios que intersectan [from,to]
 * y recorta al rango para que si un turno cruza medianoche
 * cuente solo lo que corresponde dentro del rango.
 */
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

/** =========================
 *  Hook
 *  ========================= */
export function useHorarios() {
    const endpoint = useMemo(() => `${baseUrl}/horarios`, [baseUrl])

    const [horarios, setHorarios] = useState<Horario[]>([])
    const [loading, setLoading] = useState(false)

    const request = async <T,>(url: string, options: RequestInit) => {
        const res = await fetch(url, {
            headers: { 'Content-Type': 'application/json' },
            ...options,
        })

        if (!res.ok) {
            let message = 'Error de servidor'

            try {
                const data = await res.json()

                if (typeof data === 'string') {
                    message = data
                } else if (Array.isArray((data as any)?.message)) {
                    message = (data as any).message.join(', ')
                } else if ((data as any)?.message) {
                    message = (data as any).message
                }
            } catch {
                message = await res.text()
            }

            throw new Error(message)
        }

        return (await res.json()) as T
    }

    const fetchAll = useCallback(async () => {
        try {
            setLoading(true)
            const data = await request<Horario[]>(endpoint, { method: 'GET' })
            setHorarios(data)
        } catch {
            // si no hay GET no rompemos nada
        } finally {
            setLoading(false)
        }
    }, [endpoint])

    const marcarIngreso = useCallback(
        async (payload: CreateHorarioDto) => {
            try {
                setLoading(true)

                const horario = await request<Horario>(endpoint, {
                    method: 'POST',
                    body: JSON.stringify({
                        vendedorId: payload.vendedorId,
                        horaIngreso: toIso(payload.horaIngreso),
                    }),
                })

                setHorarios((prev) => [horario, ...prev])
                toast.success('Ingreso marcado correctamente')
                return horario
            } catch (e: any) {
                console.log(e.message)
                toast.error(e.message || 'Error al marcar ingreso')
                throw e
            } finally {
                setLoading(false)
            }
        },
        [endpoint]
    )

    const marcarEgreso = useCallback(
        async (vendedorId: number, payload: MarcarEgresoDto = {}) => {
            const horario = await request<Horario>(`${endpoint}/vendedor/${vendedorId}/egreso`, {
                method: 'POST',
                body: JSON.stringify({ horaEgreso: toIso(payload.horaEgreso) }),
            })

            await fetchAll()
            toast.success('Egreso marcado correctamente')
            return horario
        },
        [endpoint, fetchAll]
    )



    /** =========================
     *  ✅ NUEVO: filtro + totales
     *  ========================= */

    // Filtra turnos por vendedor (cliente-side)
    const filterByVendedor = useCallback(
        (vendedorId?: number | null) => {
            if (!vendedorId) return horarios
            return horarios.filter((h) => h.vendedor?.id === vendedorId)
        },
        [horarios]
    )

    // Total horas de un día (por defecto hoy). Opcional vendedorId.
    const getHorasDia = useCallback(
        (date: Date = new Date(), vendedorId?: number) => {
            const from = startOfDayLocal(date)
            const to = endOfDayLocal(date)
            return round2(sumHoursInRange(horarios, from, to, vendedorId))
        },
        [horarios]
    )

    // Total horas de la semana (lunes->domingo). Opcional vendedorId.
    const getHorasSemana = useCallback(
        (date: Date = new Date(), vendedorId?: number) => {
            const from = startOfWeekMondayLocal(date)
            const to = endOfWeekMondayLocal(date)
            return round2(sumHoursInRange(horarios, from, to, vendedorId))
        },
        [horarios]
    )

    // Total horas del mes. Opcional vendedorId.
    const getHorasMes = useCallback(
        (date: Date = new Date(), vendedorId?: number) => {
            const from = startOfMonthLocal(date)
            const to = endOfMonthLocal(date)
            return round2(sumHoursInRange(horarios, from, to, vendedorId))
        },
        [horarios]
    )

    // Total horas por rango arbitrario. Opcional vendedorId.
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

        // ✅ nuevos
        filterByVendedor,
        getHorasDia,
        getHorasSemana,
        getHorasMes,
        getHorasRango,
    }
}
