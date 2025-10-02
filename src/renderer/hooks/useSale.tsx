// src/hooks/useVenta.ts
import { useEffect, useMemo } from 'react'
import { useAppDispatch, useAppSelector } from '../store/hooks'
import { fetchSaleById, makeSelectVentaById, needsRefresh, selectLoadingVenta } from '../store/salesReduce'


/** Usa el mismo estado que llena `useSales`, y refresca si hace falta */
export function useSale(id: string | number, ttlMs = 60_000) {
  const dispatch = useAppDispatch()
  const selectVentaById = useMemo(makeSelectVentaById, [])
  const venta = useAppSelector(s => selectVentaById(s, id))
  const stale = useAppSelector(s => needsRefresh(s, id, ttlMs))
  const loading = useAppSelector(s => selectLoadingVenta(s, id))

  useEffect(() => {
    if (!venta || stale) dispatch(fetchSaleById(id))
  }, [dispatch, id, !!venta, stale])

  return { venta, loading }
}
