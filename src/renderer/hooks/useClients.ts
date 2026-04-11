import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getAll } from '../api/crud'

export type Cliente = { id: number; nombre: string; [k: string]: any }

const DEBOUNCE_MS = 200

export function useClients() {
  const [items, setItems] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAll<Cliente>('clientes')
      setItems(data)
      setError(null)
    } catch (e) {
      setError(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  const timer = useRef<number | null>(null)
  const debouncedRefetch = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      refetch()
      timer.current = null
    }, DEBOUNCE_MS)
  }, [refetch])

  useEffect(() => {
    const onFocus = () => debouncedRefetch()
    const onVis = () => {
      if (document.visibilityState === 'visible') debouncedRefetch()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [debouncedRefetch])

  const mapById = useMemo(() => {
    const m = new Map<number, Cliente>()
    for (const c of items) m.set(c.id, c)
    return m
  }, [items])

  const getById = useCallback((id?: number | null) => {
    if (id == null) return null
    return mapById.get(id) ?? null
  }, [mapById])

  return { clients: items, loading, error, refetch, getById }
}
