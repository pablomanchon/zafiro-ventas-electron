import { useEffect, useCallback } from 'react'
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
  const { range, filter, setFilter, shift, goToday, label } = useDateRange(initialMode)

  const dispatch = useAppDispatch()
  const ventas = useAppSelector(selectVentas)
  const totales = useAppSelector(selectTotales)
  const loading = useAppSelector(selectLoading)
  const error = useAppSelector(selectError)
  const totalGeneral = useAppSelector(selectTotalGeneral)

  const reload = useCallback(() => dispatch(fetchSales(range)), [dispatch, range])

  useEffect(() => {
    reload()
  }, [reload, range?.from, range?.to])

  return {
    ventas,
    totales,
    totalGeneral,
    loading,
    error,
    range,
    filter,
    setFilter,
    shift,
    goToday,
    label,
    reload,
  }
}
