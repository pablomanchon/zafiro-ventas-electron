// src/components/PaymentMethodsTable.tsx
import { useEffect, useMemo, useState } from 'react'
import { getAll } from '../../api/crud'
import Table from '../../layout/Table'

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
  /** Total de la venta (para calcular "restante") */
  total?: number
}

const EMPTY_PAYMENT = (): PaymentItem => ({ metodoId: '', nombre: '', monto: '', cuotas: '' })

export default function PaymentMethodsTable({ value, onChange, total = 0 }: Props) {
  const [methods, setMethods] = useState<Metodo[]>([])
  const [items, setItems] = useState<PaymentItem[]>(
    Array.isArray(value) && value.length > 0
      ? value.map(it => ({ ...it, monto: String(it.monto ?? ''), cuotas: it.cuotas ?? '' }))
      : [EMPTY_PAYMENT(), EMPTY_PAYMENT()] // ← 3 filas iniciales
  )

  // si llega un value nuevo desde afuera (reset formulario, etc.), reflejarlo;
  // si viene vacío, mantenemos 4 filas
  useEffect(() => {
    if (Array.isArray(value)) {
      setItems(
        value.length > 0
          ? value.map(it => ({ ...it, monto: String(it.monto ?? ''), cuotas: it.cuotas ?? '' }))
          : [EMPTY_PAYMENT(), EMPTY_PAYMENT()]
      )
    }
  }, [value])

  useEffect(() => {
    getAll<Metodo>('metodo-pago').then(setMethods).catch(console.error)
  }, [])

  // Suma de montos actuales
  const sumaMontos = useMemo(
    () => items.reduce((acc, it) => acc + (parseFloat(it.monto || '0') || 0), 0),
    [items]
  )

  // helper set + notify
  const updateItems = (updater: (prev: PaymentItem[]) => PaymentItem[]) => {
    setItems(prev => {
      const next = updater(prev)
      onChange?.(next)
      return next
    })
  }

  // autocompletar nombre y monto (con restante) al setear metodoId
  const onMetodoIdChange = (idx: number, raw: string) => {
    updateItems(prev => {
      const next = [...prev]
      const m = methods.find(mm => mm.id === raw)

      // calcular restante EXCLUYENDO la fila actual
      const sumaOtros = prev.reduce((acc, it, i) => {
        if (i === idx) return acc
        return acc + (parseFloat(it.monto || '0') || 0)
      }, 0)
      const restante = Math.max(0, Number((total - sumaOtros).toFixed(2)))

      const esCredito = m?.tipo === 'credito'

      next[idx] = {
        ...next[idx],
        metodoId: raw,
        nombre: m?.nombre ?? '',
        monto: restante ? String(restante) : '',
        // 👉 si es crédito, seteamos cuotas=1 automáticamente
        cuotas: esCredito ? '1' : '',
      }
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

  // Al agregar nueva fila (restante con el mismo redondeo)
  const handleAdd = () => {
    const restante = Math.max(0, Number((total - sumaMontos).toFixed(2)))
    updateItems(prev => [
      ...prev,
      { metodoId: '', nombre: '', monto: restante ? String(restante) : '', cuotas: '' },
    ])
  }

  const handleRemove = (idx: number) => {
    updateItems(prev => prev.filter((_, i) => i !== idx))
  }

  const needsCuotas = items.some(it => {
    const m = methods.find(mm => mm.id === it.metodoId)
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
    const m = methods.find(mm => mm.id === it.metodoId)
    const isCredito = m?.tipo === 'credito'
    const valorCuota =
      isCredito && it.cuotas
        ? (parseFloat(it.monto || '0') / Math.max(1, parseInt(it.cuotas || '1', 10))).toFixed(2)
        : ''

    return {
      id: `${i}`,
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
          className="w-24 bg-inherit outline-none text-white px-1 text-right"
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
      <div className="text-white/80 text-sm">
        Pagado: ${sumaMontos.toFixed(2)} • Restante: ${(Math.max(0, total - sumaMontos)).toFixed(2)}
      </div>

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
