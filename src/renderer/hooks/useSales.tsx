// src/hooks/useSales.ts
import { useEffect, useMemo, useRef, useState } from 'react'
import { getAll } from '../api/crud'
import { useDateRange } from './useDate'

type TotalPorTipo = { tipo: string; total: number }

export default function useSales(initialMode: 'day' | 'week' | 'month' = 'day') {
  // Fecha/rango + helpers
  const { range, filter, setFilter, shift, goToday, label } = useDateRange(initialMode)

  // Datos
  const [ventas, setVentas] = useState<any[]>([])
  const [totales, setTotales] = useState<TotalPorTipo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // control para evitar setState tras unmount
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  const fetchAll = async () => {
    setLoading(true)
    setError(null)
    try {
      const [ventasRes, totalesRes] = await Promise.all([
        getAll('ventas', range),
        getAll('ventas/totales/tipos', range),
      ])
      if (!alive.current) return
      setVentas(ventasRes ?? [])
      setTotales(totalesRes ?? [])
    } catch (e: any) {
      if (!alive.current) return
      setError(e?.message ?? 'Error cargando ventas')
    } finally {
      if (alive.current) setLoading(false)
    }
  }

  // actualiza cuando cambia el rango
  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range?.from, range?.to])

  // Por si querés computar un total global en UI
  const totalGeneral = useMemo(
    () => totales.reduce((acc, t) => acc + Number(t.total ?? 0), 0),
    [totales]
  )

  return {
    // datos
    ventas,
    totales,
    totalGeneral,
    loading,
    error,

    // rango/fecha + helpers
    range,
    filter, setFilter, shift, goToday, label,

    // acciones
    reload: fetchAll,
  }
}
