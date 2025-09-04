// src/hooks/useDateRange.tsx
import { useState, useMemo, useEffect } from 'react'
import PrimaryButton from '../components/PrimaryButton'

export type DateFilter = 'day' | 'week' | 'month'

function startOfDay(d: Date) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x
}
function startOfWeekMonday(d: Date) {
  const x = startOfDay(d)
  const dayIdx = (x.getDay() + 6) % 7 // lunes=0 … domingo=6
  x.setDate(x.getDate() - dayIdx)
  return x
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}
function addDays(d: Date, n: number) {
  const x = new Date(d); x.setDate(x.getDate() + n); return x
}
function addWeeks(d: Date, n: number) { return addDays(d, n * 7) }
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1)
}

type UseDateRangeOptions = {
  /** Habilita navegación con teclas ← →. Default: true */
  keyboard?: boolean
}

export function useDateRange(initial: DateFilter = 'day', opts: UseDateRangeOptions = {}) {
  const { keyboard = true } = opts

  const [filter, setFilter] = useState<DateFilter>(initial)
  const [anchor, setAnchor] = useState<Date>(new Date())

  const range = useMemo(() => {
    if (filter === 'day') {
      const start = startOfDay(anchor)
      const end = addDays(start, 1)
      return { from: start.toISOString(), to: end.toISOString() }
    }
    if (filter === 'week') {
      const monday = startOfWeekMonday(anchor)
      const end = addDays(monday, 7)
      return { from: monday.toISOString(), to: end.toISOString() }
    }
    const start = startOfMonth(anchor)
    const end = addMonths(start, 1)
    return { from: start.toISOString(), to: end.toISOString() }
  }, [filter, anchor])

  const label = useMemo(() => {
    const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
      d.toLocaleDateString('es-AR', opts)

    if (filter === 'day') {
      return fmt(startOfDay(anchor), { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
    }
    if (filter === 'week') {
      const mon = startOfWeekMonday(anchor)
      const sun = addDays(mon, 6)
      return `${fmt(mon, { day: '2-digit', month: 'short' })} – ${fmt(sun, { day: '2-digit', month: 'short', year: 'numeric' })}`
    }
    return anchor.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  }, [filter, anchor])

  const shift = (dir: -1 | 1) => {
    setAnchor(prev => {
      if (filter === 'day') return addDays(prev, dir)
      if (filter === 'week') return addWeeks(prev, dir)
      return addMonths(prev, dir)
    })
  }

  const goToday = () => setAnchor(new Date())

  // ⌨️ Navegación con teclado ← →
  useEffect(() => {
    if (!keyboard) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') shift(-1)
      if (e.key === 'ArrowRight') shift(1)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // depende de 'filter' implícitamente a través de shift()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keyboard, filter])

  return { filter, setFilter, anchor, setAnchor, range, label, shift, goToday }
}

// Componente auxiliar para reutilizar UI
export function DateNavigator({
  filter, setFilter, shift, goToday, label, className
}: {
  filter: DateFilter
  setFilter: (f: DateFilter) => void
  shift: (dir: -1 | 1) => void
  goToday: () => void
  label: string
  className?: string
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 w-full ${className ?? ''}`}>
      <div className="flex gap-2 text-md">
        {(['day', 'week', 'month'] as DateFilter[]).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              (filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-white') + ' px-3 py-1 rounded'
            }
          >
            {f === 'day' ? 'Hoy' : f === 'week' ? 'Semana' : 'Mes'}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <PrimaryButton functionClick={() => shift(-1)} title="<" />
        <span className="text-sm md:text-base text-gray-200">{label}</span>
        <PrimaryButton functionClick={() => shift(1)} title=">" />
        <PrimaryButton functionClick={goToday} title="Hoy" />
      </div>
    </div>
  )
}
