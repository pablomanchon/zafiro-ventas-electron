// src/hooks/useSaleItems.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { useProducts } from '../../hooks/useProducts'

type Product = { id: string; nombre: string; precio: number }

export interface SaleItem {
  productId: string | ''
  nombre: string
  precio: number
  cantidad: number | ''
  descuento: number | ''
  precioFinal: number
}

function shallowEqualItems(a?: SaleItem[], b?: SaleItem[]) {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const A = a[i], B = b[i]
    if (
      A.productId !== B.productId ||
      A.nombre !== B.nombre ||
      A.precio !== B.precio ||
      A.cantidad !== B.cantidad ||
      A.descuento !== B.descuento ||
      A.precioFinal !== B.precioFinal
    ) return false
  }
  return true
}

export function useSaleItems(
  value?: SaleItem[],
  onChange?: (items: SaleItem[]) => void
) {
  const { products, loading, error } = useProducts() as {
    products: Product[]
    loading: boolean
    error?: unknown
  }

  // Helpers arriba para usarlos en el init
  const computeFinal = (precio: number, cantidad: number | '', descuento: number | '') => {
    const qty = Number(cantidad) || 0
    const disc = Number(descuento) || 0
    const pct = Math.max(0, Math.min(100, disc))
    return Math.max(0, precio * qty * (1 - pct / 100))
  }

  const makeBase = (): SaleItem => {
    const base: SaleItem = {
      productId: '',
      nombre: '',
      precio: 0,
      cantidad: 1,
      descuento: 0,
      precioFinal: 0,
    }
    base.precioFinal = computeFinal(base.precio, base.cantidad, base.descuento)
    return base
  }

  // ✅ Si no viene "value", arrancá con 4 filas pre-cargadas
  const [items, setItems] = useState<SaleItem[]>(() => {
    if (Array.isArray(value)) return value           // modo controlado/edición
    return [makeBase(), makeBase(), makeBase()] // modo crear
  })

  // Flags/refs de control
  const syncingFromProp = useRef(false)
  const onChangeRef = useRef<typeof onChange>()
  const didMountRef = useRef(false)

  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // Sincronizar DESDE la prop solo si difiere (modo controlado)
  useEffect(() => {
    if (Array.isArray(value) && !shallowEqualItems(value, items)) {
      syncingFromProp.current = true
      setItems(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]) // no dependas de items acá

  // Emitir HACIA el padre cuando cambian items localmente (no en el primer mount ni durante sync)
  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    if (syncingFromProp.current) {
      syncingFromProp.current = false
      return
    }
    onChangeRef.current?.(items)
  }, [items])

  const updateRow = useCallback((idx: number, partial: Partial<SaleItem>) => {
    setItems(prev => {
      const row = { ...prev[idx], ...partial }
      if ('precio' in partial || 'cantidad' in partial || 'descuento' in partial) {
        row.precioFinal = computeFinal(row.precio, row.cantidad, row.descuento)
      }
      const next = [...prev]
      next[idx] = row
      return next
    })
  }, [])

  const onProductIdChange = useCallback((idx: number, raw: string) => {
    const id = (raw ?? '').trim() as string | ''
    updateRow(idx, { productId: id })
    if (id === '') {
      updateRow(idx, { nombre: '', precio: 0 })
      return
    }
    const prod = products.find(p => p.id === id)
    updateRow(idx, { nombre: prod?.nombre ?? '', precio: prod?.precio ?? 0 })
  }, [products, updateRow])

  const handleAdd = useCallback(() =>
    setItems(prev => [...prev, makeBase()]), []
  )

  const handleRemove = useCallback((idx: number) =>
    setItems(prev => prev.filter((_, i) => i !== idx)), []
  )

  return { items, loading, error, updateRow, onProductIdChange, handleAdd, handleRemove }
}
