// src/components/useSaleItems.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { useProducts } from '../../hooks/useProducts'

type Product = { id: string; nombre: string; precio: number | string }

export interface SaleItem {
  productId: string | ''
  nombre: string
  precio: number
  cantidad: number | ''
  descuento: number | ''
  precioFinal: number
}

// ───────────────── helpers ─────────────────
const toNum = (v: unknown, def = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
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

// ───────────────── hook ─────────────────
export function useSaleItems(
  value?: SaleItem[],
  onChange?: (items: SaleItem[]) => void
) {
  const { products, loading, error } = useProducts() as {
    products: Product[]
    loading: boolean
    error?: unknown
  }

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

  const [items, setItems] = useState<SaleItem[]>(() => {
    if (Array.isArray(value)) {
      return value.map(it => ({
        ...it,
        precio: toNum(it.precio),
        cantidad: it.cantidad === '' ? '' : toNum(it.cantidad, 1),
        descuento: it.descuento === '' ? '' : toNum(it.descuento, 0),
        precioFinal: toNum(it.precioFinal),
      }))
    }
    return [makeBase(), makeBase(), makeBase()]
  })

  // flags
  const syncingFromProp = useRef(false)
  const onChangeRef = useRef<typeof onChange>()
  const didMountRef = useRef(false)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  // sync DESDE prop
  useEffect(() => {
    if (Array.isArray(value) && !shallowEqualItems(value, items)) {
      const normalized: SaleItem[] = value.map((it): SaleItem => {
        const precio = toNum(it.precio)

        // 🔹 forzamos el literal '' en la unión
        const cantidad: SaleItem['cantidad'] =
          it.cantidad === '' ? '' : toNum(it.cantidad, 1)

        const descuento: SaleItem['descuento'] =
          it.descuento === '' ? '' : toNum(it.descuento, 0)

        const precioFinal = computeFinal(precio, cantidad, descuento)

        return {
          // si tu value podría traer productId solo como string, lo normalizamos
          productId: (it.productId ?? '') as SaleItem['productId'],
          nombre: it.nombre ?? '',
          precio,
          cantidad,
          descuento,
          precioFinal,
        }
      })

      syncingFromProp.current = true
      setItems(normalized)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])


  // emitir HACIA el padre
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

      // forzar tipos numéricos coherentes
      row.precio = toNum(row.precio)
      if (row.cantidad !== '') row.cantidad = toNum(row.cantidad, 1)
      if (row.descuento !== '') row.descuento = toNum(row.descuento, 0)

      row.precioFinal = computeFinal(row.precio, row.cantidad, row.descuento)
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
    updateRow(idx, { nombre: prod?.nombre ?? '', precio: toNum(prod?.precio) })
  }, [products, updateRow])

  const handleAdd = useCallback(() => setItems(prev => [...prev, makeBase()]), [])
  const handleRemove = useCallback((idx: number) => setItems(prev => prev.filter((_, i) => i !== idx)), [])

  return { items, loading, error, updateRow, onProductIdChange, handleAdd, handleRemove }
}
