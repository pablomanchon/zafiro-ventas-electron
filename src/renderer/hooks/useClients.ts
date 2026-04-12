import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAll } from '../api/crud'

export type Cliente = { id: number; nombre: string; [k: string]: any }

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
