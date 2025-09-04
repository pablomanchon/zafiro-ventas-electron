import { useEffect, useState } from 'react'
import { getAll } from '../../api/crud'
import Table from '../../layout/Table'

// src/components/PaymentMethodsTable.tsx
// Extensión: soporta cuotas si el método es de tipo crédito

export interface PaymentItem {
  metodoId: string
  nombre: string
  monto: string
  cuotas?: string   // número de cuotas (solo para crédito)
}

interface Metodo {
  id: string
  nombre: string
  tipo: 'debito' | 'credito'
  [key: string]: any
}

interface Props {
  value?: PaymentItem[]
  onChange?: (items: PaymentItem[]) => void
}

export default function PaymentMethodsTable({ value, onChange }: Props) {
  const [methods, setMethods] = useState<Metodo[]>([])
  const [items, setItems] = useState<PaymentItem[]>(() =>
    Array.isArray(value)
      ? value.map(it => ({ ...it, monto: String(it.monto), cuotas: it.cuotas ?? '' }))
      : []
  )

  // Carga de métodos de pago solo una vez
  useEffect(() => {
    getAll<Metodo>('metodo-pago')
      .then(setMethods)
      .catch(console.error)
  }, [])


  // Función para actualizar items y notificar al padre justo después
  const updateItems = (updater: (prev: PaymentItem[]) => PaymentItem[]) => {
    setItems(prev => {
      const next = updater(prev)
      onChange?.(next)
      return next
    })
  }

  const onMetodoIdChange = (idx: number, raw: string) => {
    updateItems(prev => {
      const next = [...prev]
      const current = { ...next[idx], metodoId: raw, nombre: '', cuotas: '' }
      const m = methods.find(m => m.id === raw)
      if (m) current.nombre = m.nombre
      next[idx] = current
      return next
    })
  }

  const onMontoChange = (idx: number, raw: string) => {
    updateItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], monto: raw }
      return next
    })
  }

  const onCuotasChange = (idx: number, raw: string) => {
    updateItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], cuotas: raw }
      return next
    })
  }

  const handleAdd = () => {
    updateItems(prev => [
      ...prev,
      { metodoId: '', nombre: '', monto: '', cuotas: '' }
    ])
  }

  const handleRemove = (idx: number) => {
    updateItems(prev => prev.filter((_, i) => i !== idx))
  }

  const needsCuotas = items.some(it => {
    const m = methods.find(m => m.id === it.metodoId)
    return m?.tipo === 'credito'
  })

  const baseHeaders = [
    { titulo: 'ID Método', clave: 'metodoId' },
    { titulo: 'Nombre', clave: 'nombre' },
    { titulo: 'Monto', clave: 'monto' },
  ]
  const extraHeaders = needsCuotas
    ? [
      { titulo: 'Cuotas', clave: 'cuotas' },
      { titulo: 'Valor cuota', clave: 'valorCuota' },
      { titulo: 'Total', clave: 'total' },
    ]
    : []
  const encabezados = [...baseHeaders, ...extraHeaders, { titulo: 'Acciones', clave: 'acciones' }]

  const datosTabla = items.map((it, i) => {
    const m = methods.find(m => m.id === it.metodoId)
    const isCredito = m?.tipo === 'credito'
    const valorCuota = isCredito && it.cuotas
      ? (parseFloat(it.monto || '0') / parseInt(it.cuotas || '1', 10)).toFixed(2)
      : ''

    return {
      id: `${it.metodoId}-${i}`,
      metodoId: (
        <input
          type="text"
          className="w-full bg-inherit outline-none text-white px-1"
          value={it.metodoId}
          onChange={e => onMetodoIdChange(i, e.target.value)}
          onBlur={e => onMetodoIdChange(i, e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              onMetodoIdChange(i, e.currentTarget.value)
            }
          }}
        />
      ),
      nombre: it.nombre,
      monto: (
        <input
          type="number"
          min={0}
          className="w-20 bg-inherit outline-none text-white px-1"
          value={it.monto}
          onChange={e => onMontoChange(i, e.target.value)}
          onBlur={e => onMontoChange(i, e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              onMontoChange(i, e.currentTarget.value)
            }
          }}
        />
      ),
      ...(needsCuotas && {
        cuotas: (
          <input
            type="number"
            min={1}
            className="w-16 bg-inherit outline-none text-white px-1"
            value={it.cuotas}
            onChange={e => onCuotasChange(i, e.target.value)}
          />
        ),
        valorCuota,
        total: it.monto,
      }),
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
    <div className="space-y-2">
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
        + Agregar método
      </button>
    </div>
  )
}

// Nota: para que esto funcione, tu entidad MetodoPago en backend debe incluir
// un campo `tipo: 'debito' | 'credito'`. P.ej. en NestJS:
//
// @Column({ type: 'text', default: 'debito' })
// tipo: 'debito' | 'credito';
