// src/components/item-venta/useSaleItems.ts
import { useEffect, useRef, useState, useCallback } from 'react'
import { useProducts } from '../../hooks/useProducts'

type Product = {
  id: number | string
  codigo: string
  nombre: string
  precio: number | string
}

export interface SaleItem {
  // ⚠️ este campo representa el CÓDIGO (string)
  productId: string | ''
  nombre: string
  precio: number
  cantidad: number | ''

  // Descuento por línea: % y/o monto (ARS)
  descuentoPct: number | ''
  descuentoMonto: number | ''

  // Total de la línea luego de descuentos (no unitario)
  precioFinal: number
}

// ───────────────── helpers ─────────────────
const toNum = (v: unknown, def = 0) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : def
}

const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n))

function shallowEqualItems(a?: SaleItem[], b?: SaleItem[]) {
  if (a === b) return true
  if (!a || !b || a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const A = a[i]
    const B = b[i]
    if (
      A.productId !== B.productId ||
      A.nombre !== B.nombre ||
      A.precio !== B.precio ||
      A.cantidad !== B.cantidad ||
      A.descuentoPct !== B.descuentoPct ||
      A.descuentoMonto !== B.descuentoMonto ||
      A.precioFinal !== B.precioFinal
    ) {
      return false
    }
  }
  return true
}

export function useSaleItems(value?: SaleItem[], onChange?: (items: SaleItem[]) => void) {
  const { products, loading, error } = useProducts() as {
    products: Product[]
    loading: boolean
    error?: unknown
  }

  const computeFinal = (
    precio: number,
    cantidad: number | '',
    descuentoPct: number | '',
    descuentoMonto: number | ''
  ) => {
    const qty = Number(cantidad) || 0
    const pct = clamp(Number(descuentoPct) || 0, 0, 100)
    const monto = Math.max(0, Number(descuentoMonto) || 0)

    const base = precio * qty
    const afterPct = base * (1 - pct / 100)
    return Math.max(0, afterPct - monto)
  }

  const makeBase = (): SaleItem => {
    const base: SaleItem = {
      productId: '',
      nombre: '',
      precio: 0,
      cantidad: 1,
      descuentoPct: '',
      descuentoMonto: '',
      precioFinal: 0,
    }

    base.precioFinal = computeFinal(base.precio, base.cantidad, base.descuentoPct, base.descuentoMonto)
    return base
  }

  const [items, setItems] = useState<SaleItem[]>(() => {
    if (Array.isArray(value)) {
      return value.map((it) => {
        const precio = toNum(it.precio)
        const cantidad: SaleItem['cantidad'] = it.cantidad === '' ? '' : toNum(it.cantidad, 1)

        const descuentoPct: SaleItem['descuentoPct'] =
          (it as any).descuentoPct === '' ? '' : toNum((it as any).descuentoPct ?? 0, 0)

        const descuentoMonto: SaleItem['descuentoMonto'] =
          (it as any).descuentoMonto === '' ? '' : toNum((it as any).descuentoMonto ?? 0, 0)

        const precioFinal = computeFinal(precio, cantidad, descuentoPct, descuentoMonto)

        return {
          productId: (it.productId ?? '') as SaleItem['productId'],
          nombre: it.nombre ?? '',
          precio,
          cantidad,
          descuentoPct,
          descuentoMonto,
          precioFinal,
        }
      })
    }

    // ✅ 3 filas vacías por defecto (si querés 4, duplicá una más)
    return [makeBase(), makeBase(), makeBase()]
  })

  // flags
  const syncingFromProp = useRef(false)
  const onChangeRef = useRef<typeof onChange>()
  const didMountRef = useRef(false)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  // sync DESDE prop
  useEffect(() => {
    if (Array.isArray(value) && !shallowEqualItems(value, items)) {
      const normalized: SaleItem[] = value.map((it): SaleItem => {
        const precio = toNum(it.precio)

        const cantidad: SaleItem['cantidad'] = it.cantidad === '' ? '' : toNum(it.cantidad, 1)

        const descuentoPct: SaleItem['descuentoPct'] =
          (it as any).descuentoPct === '' ? '' : toNum((it as any).descuentoPct ?? 0, 0)

        const descuentoMonto: SaleItem['descuentoMonto'] =
          (it as any).descuentoMonto === '' ? '' : toNum((it as any).descuentoMonto ?? 0, 0)

        const precioFinal = computeFinal(precio, cantidad, descuentoPct, descuentoMonto)

        return {
          productId: (it.productId ?? '') as SaleItem['productId'],
          nombre: it.nombre ?? '',
          precio,
          cantidad,
          descuentoPct,
          descuentoMonto,
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
    setItems((prev) => {
      const row = { ...prev[idx], ...partial }

      row.precio = toNum(row.precio)

      if (row.cantidad !== '') row.cantidad = toNum(row.cantidad, 1)
      if (row.descuentoPct !== '') row.descuentoPct = toNum(row.descuentoPct, NaN)
      if (row.descuentoMonto !== '') row.descuentoMonto = toNum(row.descuentoMonto, NaN)

      row.precioFinal = computeFinal(row.precio, row.cantidad, row.descuentoPct, row.descuentoMonto)

      const next = [...prev]
      next[idx] = row
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [products])

  // ✅ busca por CÓDIGO (no por id numérico)
  const onProductIdChange = useCallback(
    (idx: number, raw: string) => {
      const codigo = (raw ?? '').trim() as string | ''
      updateRow(idx, { productId: codigo })

      if (codigo === '') {
        updateRow(idx, { nombre: '', precio: 0 })
        return
      }

      const prod = products.find((p) => String(p.codigo).toLowerCase() === codigo.toLowerCase())
      updateRow(idx, { nombre: prod?.nombre ?? '', precio: toNum(prod?.precio) })
    },
    [products, updateRow]
  )

  const handleAdd = useCallback(() => setItems((prev) => [...prev, makeBase()]), [])
  const handleRemove = useCallback((idx: number) => setItems((prev) => prev.filter((_, i) => i !== idx)), [])

  return { items, loading, error, updateRow, onProductIdChange, handleAdd, handleRemove }
}
