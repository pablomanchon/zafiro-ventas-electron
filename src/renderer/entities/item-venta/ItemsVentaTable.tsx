// src/components/ItemsVentaTable.tsx
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


  const renderNumberCell = (
    idx: number,
    field: 'productId' | 'cantidad' | 'descuento',
    parser: (raw: string) => number | '',
    attrs: Omit<JSX.IntrinsicElements['input'], 'value' | 'onChange' | 'type'>
  ) => (
    <input
      type="number"
      value={items[idx][field] as number | ''}
      onChange={(e) => {
        const val = parser(e.target.value)
        updateRow(idx, { [field]: val } as any)
      }}
      onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
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

  const datosTabla = items.map((it: { nombre: any; precio: number; precioFinal: number }, i: number) => ({
    id: i,
    productId: (
      <input
        type="text"
        value={items[i].productId as string}
        onChange={(e) => {
          // guardamos el string tal cual para luego procesarlo al salir
          updateRow(i, { productId: e.target.value } as any)
        }}
        onBlur={(e) => {
          // al perder foco buscamos el producto
          onProductIdChange(i, e.target.value)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            onProductIdChange(i, e.currentTarget.value)
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
    <div className="space-y-2">
      {loading && <p className="text-white">Cargando productos...</p>}
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
