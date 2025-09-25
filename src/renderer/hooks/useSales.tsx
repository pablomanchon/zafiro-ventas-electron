// src/hooks/useSales.ts
import { useEffect } from 'react'
import { useDateRange } from './useDate'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import {
  fetchSales,
  selectVentas,
  selectTotales,
  selectLoading,
  selectError,
  selectTotalGeneral,
} from '../store/salesReduce'

export default function useSales(initialMode: 'day' | 'week' | 'month' = 'day') {
  // Fecha/rango + helpers (igual que antes)
  const { range, filter, setFilter, shift, goToday, label } = useDateRange(initialMode)

  // Redux
  const dispatch = useAppDispatch()
  const ventas = useAppSelector(selectVentas)
  const totales = useAppSelector(selectTotales)
  const loading = useAppSelector(selectLoading)
  const error = useAppSelector(selectError)
  const totalGeneral = useAppSelector(selectTotalGeneral)

  // Cargar al cambiar el rango
  useEffect(() => {
    dispatch(fetchSales(range))
  }, [dispatch, range?.from, range?.to])

  const reload = () => dispatch(fetchSales(range))

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
    reload,
  }
}
