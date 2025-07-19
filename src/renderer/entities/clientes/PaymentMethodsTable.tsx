import { useEffect, useState } from 'react'
import { getAll } from '../../api/crud'
import Table from '../../layout/Table'

// src/components/PaymentMethodsTable.tsx
export interface PaymentItem {
  /** El ID numérico del método de pago */
  metodoId: number | ''
  /** Nombre derivado tras seleccionar el método */
  nombre: string
  /** Monto ingresado para este método */
  monto: number
  /** Opcional: número de cuotas si aplica */
  cuotas?: number
}

interface Metodo {
  id: number
  nombre: string
  [key: string]: any
}

interface Props {
  value?: PaymentItem[]
  onChange?: (items: PaymentItem[]) => void
}

export default function PaymentMethodsTable({ value, onChange }: Props) {
  const [methods, setMethods] = useState<Metodo[]>([])
  const [items, setItems] = useState<PaymentItem[]>(() =>
    Array.isArray(value) ? value : []
  )

  // Cargar métodos de pago una sola vez
  useEffect(() => {
    getAll<Metodo>('metodosPago').then(setMethods).catch(console.error)
  }, [])

  // Función auxiliar para actualizar items y notificar al padre
  const updateItems = (updater: (prev: PaymentItem[]) => PaymentItem[]) => {
    setItems(prev => {
      const next = updater(prev)
      onChange?.(next)
      return next
    })
  }

  const onMetodoIdChange = (idx: number, raw: string) => {
    const id = raw === '' ? '' : parseInt(raw, 10)
    updateItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], metodoId: id, nombre: '' }
      const m = methods.find(m => m.id === id)
      if (m) next[idx] = { ...next[idx], nombre: m.nombre }
      return next
    })
  }

  const onMontoChange = (idx: number, raw: string) => {
    const monto = parseFloat(raw) || 0
    updateItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], monto }
      return next
    })
  }

  const handleAdd = () => {
    updateItems(prev => [
      ...prev,
      { metodoId: '', nombre: '', monto: 0 }
    ])
  }

  const handleRemove = (idx: number) => {
    updateItems(prev => prev.filter((_, i) => i !== idx))
  }

  const encabezados = [
    { titulo: 'ID Método', clave: 'metodoId' },
    { titulo: 'Nombre', clave: 'nombre' },
    { titulo: 'Monto', clave: 'monto' },
    { titulo: 'Acciones', clave: 'acciones' },
  ]

  const datosTabla = items.map((it, i) => ({
    id: i,
    metodoId: (
      <input
        type="number"
        className="w-full bg-inherit outline-none text-white px-1"
        value={it.metodoId}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onMetodoIdChange(i, e.target.value)
        }
      />
    ),
    nombre: it.nombre,
    monto: (
      <input
        type="number"
        min={0}
        className="w-20 bg-inherit outline-none text-white px-1"
        value={it.monto}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onMontoChange(i, e.target.value)
        }
      />
    ),
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
        + Agregar método
      </button>
    </div>
  )
}
