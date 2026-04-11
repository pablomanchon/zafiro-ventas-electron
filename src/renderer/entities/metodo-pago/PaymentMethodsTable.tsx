import { useEffect, useMemo, useRef, useState } from 'react'
import { getAll } from '../../api/crud'
import Table from '../../layout/Table'
import {
  cleanMoneyInput,
  toCents,
  centsToInput,
  formatCentsARS,
} from '../../utils/utils'

export interface PaymentItem {
  metodoId: string
  nombre: string
  monto: string
  cuotas?: string
}

interface Metodo {
  id: string
  nombre: string
  tipo: 'debito' | 'credito' | 'efectivo' | 'pendiente' | 'usd' | 'otro'
  [key: string]: any
}

interface Props {
  value?: PaymentItem[]
  onChange?: (items: PaymentItem[]) => void
  total?: number
}

const EMPTY_PAYMENT = (): PaymentItem => ({
  metodoId: '',
  nombre: '',
  monto: '',
  cuotas: '',
})

const normalizeItems = (value?: PaymentItem[]) =>
  Array.isArray(value) && value.length > 0
    ? value.map((it) => ({
        ...it,
        monto: cleanMoneyInput(String(it.monto ?? '')),
        cuotas: it.cuotas ?? '',
      }))
    : [EMPTY_PAYMENT(), EMPTY_PAYMENT()]

const sameItems = (a: PaymentItem[], b: PaymentItem[]) =>
  a.length === b.length &&
  a.every(
    (item, idx) =>
      item.metodoId === b[idx]?.metodoId &&
      item.nombre === b[idx]?.nombre &&
      item.monto === b[idx]?.monto &&
      (item.cuotas ?? '') === (b[idx]?.cuotas ?? '')
  )

export default function PaymentMethodsTable({ value, onChange, total = 0 }: Props) {
  const [methods, setMethods] = useState<Metodo[]>([])
  const [montoEditingIndex, setMontoEditingIndex] = useState<number | null>(null)
  const [items, setItems] = useState<PaymentItem[]>(() => normalizeItems(value))

  const syncingFromProp = useRef(false)
  const didMountRef = useRef(false)
  const onChangeRef = useRef<typeof onChange>()

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const normalized = normalizeItems(value)
    setItems((prev) => {
      if (sameItems(normalized, prev)) return prev
      syncingFromProp.current = true
      return normalized
    })
  }, [value])

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

  useEffect(() => {
    getAll<Metodo>('metodo-pago').then(setMethods).catch(console.error)
  }, [])

  const totalCents = Math.trunc((total ?? 0) * 100)

  const sumaMontosCents = useMemo(
    () => items.reduce((acc, it) => acc + toCents(it.monto), 0),
    [items]
  )

  const updateItems = (updater: (prev: PaymentItem[]) => PaymentItem[]) => {
    setItems((prev) => updater(prev))
  }

  const resolveMethod = (raw: string) => {
    const lookup = raw.trim().toLowerCase()
    if (!lookup) return null
    return (
      methods.find((mm) => String(mm.id).toLowerCase() === lookup) ??
      methods.find((mm) => String(mm.nombre).toLowerCase() === lookup)
    )
  }

  const setMetodoInput = (idx: number, raw: string) => {
    updateItems((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        metodoId: raw,
      }
      return next
    })
  }

  const commitMetodoIdChange = (idx: number, raw: string) => {
    updateItems((prev) => {
      const next = [...prev]
      const m = resolveMethod(raw)
      const normalizedRaw = raw.trim()

      const sumaOtrosCents = prev.reduce(
        (acc, it, i) => (i === idx ? acc : acc + toCents(it.monto)),
        0
      )
      const restanteCents = Math.max(0, totalCents - sumaOtrosCents)
      const esCredito = m?.tipo === 'credito'

      next[idx] = {
        ...next[idx],
        metodoId: m?.id ?? normalizedRaw,
        nombre: m?.nombre ?? '',
        monto: restanteCents ? centsToInput(restanteCents) : next[idx].monto,
        cuotas: esCredito ? next[idx].cuotas || '1' : '',
      }
      return next
    })
  }

  const onMontoChange = (idx: number, raw: string) => {
    updateItems((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], monto: cleanMoneyInput(raw) }
      return next
    })
  }

  const onCuotasChange = (idx: number, raw: string) => {
    const onlyDigits = (s: string) => (s ?? '').replace(/\D/g, '')
    updateItems((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], cuotas: onlyDigits(raw) }
      return next
    })
  }

  const handleAdd = () => {
    const restanteCents = Math.max(0, totalCents - sumaMontosCents)
    updateItems((prev) => [
      ...prev,
      {
        metodoId: '',
        nombre: '',
        monto: restanteCents ? centsToInput(restanteCents) : '',
        cuotas: '',
      },
    ])
  }

  const handleRemove = (idx: number) => {
    updateItems((prev) => prev.filter((_, i) => i !== idx))
  }

  const needsCuotas = items.some((it) => {
    const m = methods.find((mm) => mm.id === it.metodoId)
    return m?.tipo === 'credito'
  })

  const baseHeaders = [
    { titulo: 'Metodo', clave: 'metodoId' },
    { titulo: 'Nombre', clave: 'nombre' },
    { titulo: 'Monto', clave: 'monto' },
  ]
  const extraHeaders = needsCuotas
    ? [
        { titulo: 'Cuotas', clave: 'cuotas' },
        { titulo: 'Valor cuota', clave: 'valorCuota', tipo: 'money' },
        { titulo: 'Total', clave: 'total', tipo: 'money' },
      ]
    : []
  const encabezados = [...baseHeaders, ...extraHeaders, { titulo: 'Acciones', clave: 'acciones' }]

  const datosTabla = items.map((it, i) => {
    const m = methods.find((mm) => mm.id === it.metodoId)
    const isCredito = m?.tipo === 'credito'
    const cuotasN = Math.max(1, parseInt(it.cuotas || '1', 10))

    const montoCents = toCents(it.monto)
    const valorCuotaCents = isCredito ? Math.trunc(montoCents / cuotasN) : undefined

    return {
      id: `${i}`,
      metodoId: (
        <input
          type="text"
          className="w-full bg-inherit outline-none text-white px-1"
          value={it.metodoId}
          onChange={(e) => setMetodoInput(i, e.target.value)}
          onBlur={(e) => commitMetodoIdChange(i, e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              e.stopPropagation()
              commitMetodoIdChange(i, (e.target as HTMLInputElement).value)
            }
          }}
          placeholder="ID o nombre"
        />
      ),
      nombre: it.nombre,
      monto: (
        <input
          inputMode="decimal"
          className="w-40 bg-inherit outline-none text-white px-1 text-right"
          value={montoEditingIndex === i ? it.monto : montoCents > 0 ? formatCentsARS(montoCents) : ''}
          onFocus={(e) => {
            setMontoEditingIndex(i)
            e.currentTarget.select()
          }}
          onChange={(e) => onMontoChange(i, e.target.value)}
          onBlur={(e) => {
            onMontoChange(i, e.currentTarget.value)
            setMontoEditingIndex(null)
          }}
        />
      ),
      ...(needsCuotas && {
        cuotas: (
          <input
            inputMode="numeric"
            className="w-16 bg-inherit outline-none text-white px-1 text-center"
            value={it.cuotas}
            onChange={(e) => onCuotasChange(i, e.target.value)}
          />
        ),
        valorCuota: isCredito ? (valorCuotaCents ?? 0) / 100 : '',
        total: montoCents / 100,
      }),
      acciones: (
        <button
          type="button"
          className="p-1 bg-red-800 rounded shadow-inner shadow-black"
          onClick={() => handleRemove(i)}
        >
          X
        </button>
      ),
    }
  })

  return (
    <div className="space-y-2">
      <div className="text-white/80 text-sm flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
        Pagado: {formatCentsARS(sumaMontosCents)} • Restante:{' '}
        {formatCentsARS(Math.max(0, totalCents - sumaMontosCents))}
      </div>

      <div className="w-full overflow-x-auto">
        <div className="min-w-[680px]">
          <Table
            encabezados={encabezados}
            datos={datosTabla}
            onFilaSeleccionada={() => {}}
            onDobleClickFila={() => {}}
          />
        </div>
      </div>

      <button
        type="button"
        className="w-full sm:w-auto px-4 py-2 bg-green-800 rounded shadow-inner shadow-black text-white"
        onClick={handleAdd}
      >
        + Agregar metodo
      </button>
    </div>
  )
}
