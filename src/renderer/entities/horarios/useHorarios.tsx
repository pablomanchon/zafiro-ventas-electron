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
                } else if (Array.isArray(data?.message)) {
                    message = data.message.join(', ')
                } else if (data?.message) {
                    message = data.message
                }
            } catch {
                // si no es JSON
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
                console.log(e.message);
                toast.error(e.message || 'Error al marcar ingreso')
                throw e
            } finally {
                setLoading(false)
            }
        },
        [endpoint]
    )

    const marcarEgreso = useCallback(
        async (horarioId: number, payload: MarcarEgresoDto = {}) => {
            try {
                setLoading(true)

                const horario = await request<Horario>(`${endpoint}/${horarioId}`, {
                    method: 'POST',
                    body: JSON.stringify({
                        horaEgreso: toIso(payload.horaEgreso),
                    }),
                })

                setHorarios((prev) =>
                    prev.map((h) => (h.id === horarioId ? horario : h))
                )
                await fetchAll()
                toast.success('Egreso marcado correctamente')
                return horario
            } catch (e: any) {
                toast.error(e.message || 'Error al marcar egreso')
                throw e
            } finally {
                setLoading(false)
            }
        },
        [endpoint]
    )

    return {
        horarios,
        loading,
        fetchAll,
        marcarIngreso,
        marcarEgreso,
    }
}
