import { useCallback, useEffect, useMemo, useState } from 'react'
import { getAll } from '../api/crud'

export type Vendedor = { id: number; nombre: string }

export function useVendedores() {
  const [items, setItems] = useState<Vendedor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAll<Vendedor>('vendedores')
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
