// src/components/PaymentMethodsTable.tsx
import { useEffect, useMemo, useState } from 'react'
import { getAll } from '../../api/crud'
import Table from '../../layout/Table'
import { cleanMoneyInput, toCents, centsToInput, formatCentsARS } from '../../utils/utils' // 👈

export interface PaymentItem {
  metodoId: string
  nombre: string
  monto: string        // ahora puede tener coma, ej "98498,40"
  cuotas?: string
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
  total?: number      // en pesos (ej 98498.4)
}

const EMPTY_PAYMENT = (): PaymentItem => ({ metodoId: '', nombre: '', monto: '', cuotas: '' })

export default function PaymentMethodsTable({ value, onChange, total = 0 }: Props) {
  const [methods, setMethods] = useState<Metodo[]>([])
  const [items, setItems] = useState<PaymentItem[]>(
    Array.isArray(value) && value.length > 0
      ? value.map(it => ({
          ...it,
          monto: cleanMoneyInput(String(it.monto ?? '')), // normaliza a "digitos[,digitos]"
          cuotas: it.cuotas ?? ''
        }))
      : [EMPTY_PAYMENT(), EMPTY_PAYMENT()]
  )

  useEffect(() => {
    if (Array.isArray(value)) {
      setItems(
        value.length > 0
          ? value.map(it => ({
              ...it,
              monto: cleanMoneyInput(String(it.monto ?? '')),
              cuotas: it.cuotas ?? ''
            }))
          : [EMPTY_PAYMENT(), EMPTY_PAYMENT()]
      )
    }
  }, [value])

  useEffect(() => {
    getAll<Metodo>('metodo-pago').then(setMethods).catch(console.error)
  }, [])

  // Total en centavos que viene por props
  const totalCents = Math.trunc((total ?? 0) * 100)

  // Suma de montos actuales (centavos)
  const sumaMontosCents = useMemo(
    () => items.reduce((acc, it) => acc + toCents(it.monto), 0),
    [items]
  )

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
      const m = methods.find(mm => mm.id === raw)

      // restante EXCLUYENDO fila actual (en centavos)
      const sumaOtrosCents = prev.reduce((acc, it, i) =>
        i === idx ? acc : acc + toCents(it.monto), 0
      )
      const restanteCents = Math.max(0, totalCents - sumaOtrosCents)

      const esCredito = m?.tipo === 'credito'

      next[idx] = {
        ...next[idx],
        metodoId: raw,
        nombre: m?.nombre ?? '',
        monto: restanteCents ? centsToInput(restanteCents) : '', // 👈 no redondea
        cuotas: esCredito ? '1' : ''
      }
      return next
    })
  }

  const onMontoChange = (idx: number, raw: string) => {
    updateItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], monto: cleanMoneyInput(raw) } // 👈 deja coma
      return next
    })
  }

  const onCuotasChange = (idx: number, raw: string) => {
    const onlyDigits = (s: string) => (s ?? '').replace(/\D/g, '')
    updateItems(prev => {
      const next = [...prev]
      next[idx] = { ...next[idx], cuotas: onlyDigits(raw) }
      return next
    })
  }

  const handleAdd = () => {
    const restanteCents = Math.max(0, totalCents - sumaMontosCents)
    updateItems(prev => [
      ...prev,
      {
        metodoId: '',
        nombre: '',
        monto: restanteCents ? centsToInput(restanteCents) : '', // 👈 setea con coma si corresponde
        cuotas: ''
      },
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
    { titulo: 'Monto', clave: 'monto' },        // input, Table no lo toca
  ]
  const extraHeaders = needsCuotas
    ? [
        { titulo: 'Cuotas', clave: 'cuotas' },  // input, Table no lo toca
        { titulo: 'Valor cuota', clave: 'valorCuota' }, // número (pesos)
        { titulo: 'Total', clave: 'total' },           // número (pesos)
      ]
    : []
  const encabezados = [...baseHeaders, ...extraHeaders, { titulo: 'Acciones', clave: 'acciones' }]

  const datosTabla = items.map((it, i) => {
    const m = methods.find(mm => mm.id === it.metodoId)
    const isCredito = m?.tipo === 'credito'
    const cuotasN = Math.max(1, parseInt(it.cuotas || '1', 10))

    const montoCents = toCents(it.monto)
    // “no redondear”: usamos división truncada en centavos
    const valorCuotaCents = isCredito ? Math.trunc(montoCents / cuotasN) : undefined

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
              e.preventDefault(); e.stopPropagation();
              onMetodoIdChange(i, (e.target as HTMLInputElement).value)
            }
          }}
        />
      ),
      nombre: it.nombre,
      monto: (
        <input
          inputMode="decimal"
          className="w-28 bg-inherit outline-none text-white px-1 text-right"
          value={it.monto}                           // 👈 muestra como lo teclea (con coma)
          onChange={e => onMontoChange(i, e.target.value)}
        />
      ),
      ...(needsCuotas && {
        cuotas: (
          <input
            inputMode="numeric"
            className="w-16 bg-inherit outline-none text-white px-1 text-center"
            value={it.cuotas}
            onChange={e => onCuotasChange(i, e.target.value)}
          />
        ),
        // 👉 ahora pasamos números en pesos (no elementos). Table los formatea con Intl.
        valorCuota: isCredito ? (valorCuotaCents! / 100) : '',
        total: montoCents / 100,
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
        Pagado: {formatCentsARS(sumaMontosCents)} • Restante: {formatCentsARS(Math.max(0, totalCents - sumaMontosCents))}
      </div>

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
