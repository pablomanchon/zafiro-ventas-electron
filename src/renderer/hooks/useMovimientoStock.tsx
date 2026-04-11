import { useEffect, useState, useCallback, useRef } from 'react'
import { getAll, create } from '../api/crud'
import type { StockItem } from '../entities/movimiento-stock/movimientoStockItemsTable'

export type StockMoveType = 'in' | 'out'

export interface StockMove {
  id: number | string
  moveType: StockMoveType
  createdAt?: string
  productsMoveStock?: {
    idProduct: string | number
    quantity: number
    product?: { nombre?: string }
  }[]
  [key: string]: any
}

export interface NormalizedLine {
  idProduct: string | number
  nombre: string
  quantity: number
}

const DEBOUNCE_MS = 200

export function useStockMovements() {
  const [movimientos, setMovimientos] = useState<StockMove[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<any>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getAll('movimiento-stock')
      setMovimientos(data)
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const ch = new BroadcastChannel('movimiento-stock')
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'MOVIMIENTO_CREADO') {
        load()
      }
    }

    ch.addEventListener('message', onMsg)

    return () => {
      ch.removeEventListener('message', onMsg)
      ch.close()
    }
  }, [load])

  const timer = useRef<number | null>(null)
  const debouncedLoad = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      load()
      timer.current = null
    }, DEBOUNCE_MS)
  }, [load])

  useEffect(() => {
    const onFocus = () => debouncedLoad()
    const onVis = () => {
      if (document.visibilityState === 'visible') debouncedLoad()
    }

    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVis)

    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVis)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [debouncedLoad])

  const getById = useCallback(
    (id: string | number) =>
      movimientos.find((m) => Number(m.id) === Number(id)) ?? null,
    [movimientos]
  )

  const normalizeLines = useCallback((mov: StockMove | null): NormalizedLine[] => {
    if (!mov) return []

    const origen = mov.productsMoveStock ?? mov.products ?? mov.items ?? []

    return origen.map((p: any) => {
      const idProduct = p.idProduct ?? p.productId ?? p.product?.id
      const quantity = p.quantity ?? p.cantidad ?? 0
      const nombre = p.nombre ?? p.product?.nombre ?? String(idProduct) ?? ''

      return { idProduct, nombre, quantity }
    })
  }, [])

  const createMove = useCallback(async (moveType: StockMoveType, items: StockItem[]) => {
    const productosValidos = items
      .filter((it) => it.productId && Number(it.cantidad) > 0)
      .map((it) => ({
        idProduct: it.productId,
        quantity: Number(it.cantidad),
      }))

    const result = await create('movimiento-stock', {
      moveType,
      products: productosValidos,
    })

    try {
      const ch = new BroadcastChannel('movimiento-stock')
      ch.postMessage({ type: 'MOVIMIENTO_CREADO', movimientoId: result.id })
      ch.close()
    } catch {}

    return result
  }, [])

  return {
    movimientos,
    loading,
    error,
    reload: load,
    getById,
    normalizeLines,
    createMove,
  }
}
