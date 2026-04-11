import { useEffect, useRef, useCallback } from 'react'
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

const DEBOUNCE_MS = 200

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

  const timer = useRef<number | null>(null)
  const debouncedReload = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      reload()
      timer.current = null
    }, DEBOUNCE_MS)
  }, [reload])

  useEffect(() => {
    const onFocus = () => debouncedReload()
    const onVis = () => {
      if (document.visibilityState === 'visible') debouncedReload()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [debouncedReload])

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
