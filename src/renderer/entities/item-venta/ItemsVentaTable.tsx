// src/components/ItemsVentaTable.tsx
import { useRef } from 'react'
import { useSaleItems, type SaleItem } from './useSaleItems'
import Table from '../../layout/Table'

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

  // 🔎 contenedor para buscar inputs de la tabla
  const containerRef = useRef<HTMLDivElement>(null)

  // Enfoca el input [row, col]. Si no existe y es la última fila, crea una nueva y enfoca.
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
    // si no existe y estamos queriendo ir una más abajo, agregamos fila
    if (rowIndex === items.length) {
      await handleAdd()
      // esperar al render y enfocar
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
    const nextRow = rowIndex + 1
    focusCell(nextRow, col)
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
      value={items[idx][field] as number | ''}
      onChange={(e) => {
        const val = parser(e.target.value)
        updateRow(idx, { [field]: val } as any)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          focusBelow(idx, field)                        // ← ir a la fila de abajo
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

  const datosTabla = items.map((it, i) => ({
    id: i,
    productId: (
      <input
        type="text"
        data-row={i}
        data-col="productId"                           
        value={items[i].productId as string}
        onChange={(e) => {
          updateRow(i, { productId: e.target.value } as any)
        }}
        onBlur={(e) => {
          onProductIdChange(i, e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            // primero resuelve el producto, luego baja
            onProductIdChange(i, e.currentTarget.value)
            // microtask para asegurar que posibles updates terminen
            queueMicrotask(() => focusBelow(i, 'productId'))
          }
        }}
        className="w-full bg-inherit outline-none text-white px-1"
        disabled={loading}
      />
    ),
    nombre: it.nombre,
    precio: it.precio.toFixed(2),
    cantidad: renderNumberCell(
      i,
      'cantidad',
      (raw) => (raw === '' ? '' : parseInt(raw, 10)),
      {
        min: 1,
        className: 'w-16 bg-inherit outline-none text-white px-1',
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
            className: 'w-16 bg-inherit outline-none text-white px-1',
            disabled: loading,
          }
        )}
        <span className="ml-1">%</span>
      </div>
    ),
    precioFinal: it.precioFinal.toFixed(2),
    acciones: (
      <button
        type="button"
        className="p-1 bg-red-800 rounded shadow-inner shadow-black"
        onClick={() => handleRemove(i)}
      >
        🗑
      </button>
    ),
  }))

  return (
    <div ref={containerRef} className="space-y-2">    {/* ← contenedor referenciado */}
      {loading && <p className="text-white">Cargando productos...</p>}
      {!!error && <p className="text-red-500">Error al cargar productos</p>}

      <Table
        encabezados={encabezados}
        datos={datosTabla}
        onFilaSeleccionada={() => {}}
        onDobleClickFila={() => {}}
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
