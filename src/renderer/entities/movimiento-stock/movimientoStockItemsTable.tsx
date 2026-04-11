import { useRef } from 'react'
import { toast } from 'react-toastify'
import Table from '../../layout/Table'
import { useProducts } from '../../hooks/useProducts'

type Product = {
  id: number
  codigo: string
  nombre: string
  [key: string]: unknown
}

export type StockItem = {
  productId: string
  nombre: string
  cantidad: number | ''
}

interface Props {
  value?: StockItem[]
  onChange?: (items: StockItem[]) => void
}

export default function MovimientoStockItemsTable({ value, onChange }: Props) {
  const { products } = useProducts()
  const items: StockItem[] = value ?? []

  const containerRef = useRef<HTMLDivElement>(null)

  const setItems = (next: StockItem[]) => {
    onChange?.(next)
  }

  const handleAdd = () => {
    setItems([
      ...items,
      {
        productId: '',
        nombre: '',
        cantidad: 1,
      },
    ])
  }

  const handleRemove = (index: number) => {
    const next = items.filter((_, i) => i !== index)
    setItems(next)
  }

  const updateRow = (index: number, patch: Partial<StockItem>) => {
    const next = items.map((row, i) => (i === index ? { ...row, ...patch } : row))
    setItems(next)
  }

  const focusCell = (rowIndex: number, col: 'productId' | 'cantidad') => {
    const root = containerRef.current
    if (!root) return
    const target: HTMLInputElement | null = root.querySelector(
      `input[data-col="${col}"][data-row="${rowIndex}"]`
    )
    if (target) {
      target.focus()
      target.select?.()
      return
    }

    if (rowIndex === items.length) {
      handleAdd()
      requestAnimationFrame(() => {
        const again: HTMLInputElement | null = root.querySelector(
          `input[data-col="${col}"][data-row="${rowIndex}"]`
        )
        again?.focus()
        again?.select?.()
      })
    }
  }

  const focusBelow = (rowIndex: number, col: 'productId' | 'cantidad') => {
    focusCell(rowIndex + 1, col)
  }

  const onProductIdChange = (index: number, raw: string) => {
    const lookup = raw.trim()
    if (!lookup) {
      updateRow(index, { productId: '', nombre: '' })
      return
    }

    const prod = (products as Product[]).find(
      (p) => String(p.codigo).toLowerCase() === lookup.toLowerCase() || String(p.id) === lookup
    )

    if (!prod) {
      toast.error(`No se encontró producto con código o ID ${lookup}`)
      updateRow(index, { productId: lookup, nombre: '' })
      return
    }

    updateRow(index, {
      productId: String(prod.codigo ?? lookup),
      nombre: prod.nombre ?? '',
    })
  }

  const renderNumberCell = (
    idx: number,
    field: 'cantidad',
    parser: (raw: string) => number | '',
    attrs: Omit<JSX.IntrinsicElements['input'], 'value' | 'onChange' | 'type'>
  ) => (
    <input
      type="number"
      data-row={idx}
      data-col={field}
      value={items[idx][field] === '' ? '' : (items[idx][field] as number)}
      onChange={(e) => {
        const val = parser(e.target.value)
        updateRow(idx, { [field]: val } as Partial<StockItem>)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          focusBelow(idx, field)
        }
      }}
      {...attrs}
    />
  )

  const encabezados = [
    { titulo: 'Codigo / ID', clave: 'productId' },
    { titulo: 'Nombre', clave: 'nombre' },
    { titulo: 'Cantidad', clave: 'cantidad' },
    { titulo: 'Acciones', clave: 'acciones' },
  ]

  const datosTabla = items.map((it, i) => ({
    id: i,
    productId: (
      <input
        type="text"
        data-row={i}
        data-col="productId"
        value={items[i].productId}
        onChange={(e) => updateRow(i, { productId: e.target.value })}
        onBlur={(e) => onProductIdChange(i, e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onProductIdChange(i, e.currentTarget.value)
            queueMicrotask(() => focusBelow(i, 'productId'))
          }
        }}
        className="w-full bg-inherit outline-none text-white px-1"
      />
    ),
    nombre: it.nombre || <span className="text-slate-400">-</span>,
    cantidad: renderNumberCell(
      i,
      'cantidad',
      (raw) => (raw === '' ? '' : parseInt(raw, 10)),
      {
        min: 1,
        className: 'w-16 bg-inherit outline-none text-white px-1 text-right',
      }
    ),
    acciones: (
      <button
        type="button"
        className="p-1 bg-red-800 rounded shadow-inner shadow-black"
        onClick={() => handleRemove(i)}
      >
        X
      </button>
    ),
  }))

  return (
    <div ref={containerRef} className="space-y-2">
      <Table
        encabezados={encabezados}
        datos={datosTabla}
        onFilaSeleccionada={() => {}}
        onDobleClickFila={() => {}}
      />

      <button
        type="button"
        className="px-4 py-2 bg-emerald-800 rounded shadow-inner shadow-black text-white text-sm"
        onClick={handleAdd}
      >
        + Agregar producto
      </button>
    </div>
  )
}
