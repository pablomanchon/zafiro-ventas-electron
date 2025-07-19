// src/hooks/useSaleItems.ts
import { useEffect, useState } from 'react'
import { useProducts } from '../../hooks/useProducts'

export interface SaleItem {
    productId: number | ''
    nombre: string
    precio: number
    cantidad: number | ''
    descuento: number | ''
    precioFinal: number
}

export function useSaleItems(
    value?: SaleItem[],
    onChange?: (items: SaleItem[]) => void
) {
    const { products, loading, error } = useProducts()
    const [items, setItems] = useState<SaleItem[]>(() =>
        Array.isArray(value) ? value : []
    )

    useEffect(() => {
        onChange?.(items)
    }, [items])

    const computeFinal = (
        precio: number,
        cantidad: number | '',
        descuento: number | ''
    ) => {
        const qty = Number(cantidad) || 0
        const disc = Number(descuento) || 0
        const total = precio * qty
        const pct = Math.max(0, Math.min(100, disc))
        return Math.max(0, total * (1 - pct / 100))
    }

    const updateRow = (idx: number, partial: Partial<SaleItem>) => {
        setItems(prev => {
            const row = { ...prev[idx], ...partial }
            if (
                'precio' in partial ||
                'cantidad' in partial ||
                'descuento' in partial
            ) {
                row.precioFinal = computeFinal(
                    row.precio,
                    row.cantidad,
                    row.descuento
                )
            }
            const next = [...prev]
            next[idx] = row
            return next
        })
    }

    const onProductIdChange = (idx: number, raw: string) => {
        const id = raw === '' ? '' : parseInt(raw, 10)
        updateRow(idx, { productId: id })
        if (id === '') {
            updateRow(idx, { nombre: '', precio: 0 })
            return
        }
        const prod = products.find((p) => p.id === id)
        updateRow(idx, {
            nombre: prod?.nombre ?? '',
            precio: prod?.precio ?? 0
        })
    }

    const handleAdd = () =>
        setItems(prev => [
            ...prev,
            { productId: '', nombre: '', precio: 0, cantidad: 1, descuento: 0, precioFinal: 0 }
        ])
    const handleRemove = (idx: number) =>
        setItems(prev => prev.filter((_, i) => i !== idx))

    return {
        items,
        loading,
        error,
        updateRow,
        onProductIdChange,
        handleAdd,
        handleRemove,
    }
}