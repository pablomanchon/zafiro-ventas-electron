// src/hooks/useVendedores.ts
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAll } from '../api/crud'

export type Vendedor = { id: number; nombre: string; }

const DEBOUNCE_MS = 200

export function useVendedores() {
  const [items, setItems] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAll<Vendedor>('vendedores')
      console.log(data)
      setItems(data)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  // primera carga
  useEffect(() => { refetch() }, [refetch])

  // escuchar eventos + refresh al volver a foco (con debounce)
  const timer = useRef<number | null>(null)
  const debouncedRefetch = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      refetch()
      timer.current = null
    }, DEBOUNCE_MS)
  }, [refetch])

  useEffect(() => {
    const ee = (window as Window & { entityEvents?: Window['entityEvents'] }).entityEvents
    const unsub = ee?.on?.('vendedores:changed', () => debouncedRefetch())

    const onFocus = () => debouncedRefetch()
    window.addEventListener('focus', onFocus)

    return () => {
      if (typeof unsub === 'function') unsub()
      window.removeEventListener('focus', onFocus)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [debouncedRefetch])

  // helpers
  const mapById = useMemo(() => {
    const m = new Map<number, Vendedor>()
    for (const v of items) m.set(v.id, v)
    return m
  }, [items])

  const getById = useCallback((id?: number | null) => {
    if (id == null) return null
    return mapById.get(id) ?? null
  }, [mapById])

  return { vendedores: items, loading, error, refetch, getById }
}
