// src/components/ItemsVentaTable.tsx
import { useRef } from 'react'
import { useSaleItems, type SaleItem } from './useSaleItems'
import Table from '../../layout/Table'
import { formatCurrencyARS } from '../../utils/utils'

export default function ItemsVentaTable({
  value,
  onChange,
}: {
  value?: SaleItem[]
  onChange?: (items: SaleItem[]) => void
}) {
  const {
    items,
    loading,
    error,
    updateRow,
    handleAdd,
    handleRemove,
    onProductIdChange,
  } = useSaleItems(value, onChange)

  const containerRef = useRef<HTMLDivElement>(null)

  const focusCell = async (rowIndex: number, col: 'productId' | 'cantidad' | 'descuento') => {
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
      await handleAdd()
      requestAnimationFrame(() => {
        const again: HTMLInputElement | null = root.querySelector(
          `input[data-col="${col}"][data-row="${rowIndex}"]`
        )
        again?.focus()
        again?.select?.()
      })
    }
  }

  const focusBelow = (rowIndex: number, col: 'productId' | 'cantidad' | 'descuento') => {
    focusCell(rowIndex + 1, col)
  }

  const renderNumberCell = (
    idx: number,
    field: 'cantidad' | 'descuento',
    parser: (raw: string) => number | '',
    attrs: Omit<JSX.IntrinsicElements['input'], 'value' | 'onChange' | 'type'>
  ) => (
    <input
      type="number"
      data-row={idx}
      data-col={field}
      value={
        items[idx][field] === '' ? '' : (items[idx][field] as number) // mantener '' para inputs vacíos
      }
      onChange={(e) => {
        const val = parser(e.target.value)
        updateRow(idx, { [field]: val } as any)
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
    { titulo: 'ID Producto', clave: 'productId' },
    { titulo: 'Nombre', clave: 'nombre' },
    { titulo: 'Precio', clave: 'precio' },
    { titulo: 'Cantidad', clave: 'cantidad' },
    { titulo: 'Descuento (%)', clave: 'descuento' },
    { titulo: 'Precio Final', clave: 'precioFinal' },
    { titulo: 'Acciones', clave: 'acciones' },
  ]

  const datosTabla = items.map((it, i) => {
    const precioNum = Number(it.precio) || 0
    const precioFinalNum = Number(it.precioFinal) || 0

    return {
      id: i,
      productId: (
        <input
          type="text"
          data-row={i}
          data-col="productId"
          value={items[i].productId as string}
          onChange={(e) => updateRow(i, { productId: e.target.value } as any)}
          onBlur={(e) => onProductIdChange(i, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onProductIdChange(i, e.currentTarget.value)
              queueMicrotask(() => focusBelow(i, 'productId'))
            }
          }}
          className="w-full bg-inherit outline-none text-white px-1"
          disabled={loading}
        />
      ),
      nombre: it.nombre,
      // ⬇️ nunca usamos .toFixed sobre algo que puede ser string
      precio: formatCurrencyARS(precioNum),
      cantidad: renderNumberCell(
        i,
        'cantidad',
        (raw) => (raw === '' ? '' : parseInt(raw, 10)),
        {
          min: 1,
          className: 'w-16 bg-inherit outline-none text-white px-1 text-right',
          disabled: loading,
        }
      ),
      descuento: (
        <div className="flex items-center justify-center">
          {renderNumberCell(
            i,
            'descuento',
            (raw) => (raw === '' ? '' : parseFloat(raw)),
            {
              min: 0,
              max: 100,
              className: 'w-16 bg-inherit outline-none text-white px-1 text-right',
              disabled: loading,
            }
          )}
          <span className="ml-1">%</span>
        </div>
      ),
      precioFinal: formatCurrencyARS(precioFinalNum),
      acciones: (
        <button
          type="button"
          className="p-1 bg-red-800 rounded shadow-inner shadow-black"
          onClick={() => handleRemove(i)}
        >
          🗑
        </button>
      ),
    }
  })

  return (
    <div ref={containerRef} className="space-y-2">
      {!!error && <p className="text-red-500">Error al cargar productos</p>}

      <Table
        encabezados={encabezados}
        datos={datosTabla}
        onFilaSeleccionada={() => { }}
        onDobleClickFila={() => { }}
      />

      <button
        type="button"
        className="px-4 py-2 bg-green-800 rounded shadow-inner shadow-black text-white"
        onClick={handleAdd}
      >
        + Agregar producto
      </button>
    </div>
  )
}
