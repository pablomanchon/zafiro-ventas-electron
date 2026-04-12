import { useEffect, useMemo, useState } from 'react'
import Wood from '../../layout/Steel'
import Title from '../../layout/Title'
import { useHorarios } from './useHorarios'

type FilterMode = 'day' | 'week' | 'month' | 'range'

function formatDateInput(value: Date) {
  const year = value.getFullYear()
  const month = String(value.getMonth() + 1).padStart(2, '0')
  const day = String(value.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
}

function endOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999)
}

function startOfWeek(value: Date) {
  const day = value.getDay()
  const diff = day === 0 ? -6 : 1 - day
  return startOfDay(new Date(value.getFullYear(), value.getMonth(), value.getDate() + diff))
}

function endOfWeek(value: Date) {
  const start = startOfWeek(value)
  return endOfDay(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 6))
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1, 0, 0, 0, 0)
}

function endOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth() + 1, 0, 23, 59, 59, 999)
}

function overlapsRange(inicio: Date, fin: Date, from: Date, to: Date) {
  return inicio.getTime() <= to.getTime() && fin.getTime() >= from.getTime()
}

function formatHours(hours: number) {
  return `${hours.toFixed(2)} h`
}

function getDurationHours(inicio: string, egreso: string | null) {
  const from = new Date(inicio)
  const to = egreso ? new Date(egreso) : new Date()
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0
  return Math.max(0, (to.getTime() - from.getTime()) / (1000 * 60 * 60))
}

export default function HorarioVendedor({ id }: { id: number }) {
  const { horarios, fetchAll, filterByVendedor, getHorasDia, getHorasSemana, getHorasMes, getHorasRango } =
    useHorarios()
  const [mode, setMode] = useState<FilterMode>('day')
  const [anchorDate, setAnchorDate] = useState(() => formatDateInput(new Date()))
  const [fromDate, setFromDate] = useState(() => formatDateInput(new Date()))
  const [toDate, setToDate] = useState(() => formatDateInput(new Date()))

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const lista = useMemo(() => {
    return [...filterByVendedor(id)].sort(
      (a, b) => new Date(b.horaIngreso).getTime() - new Date(a.horaIngreso).getTime()
    )
  }, [filterByVendedor, id])

  const range = useMemo(() => {
    const anchor = new Date(`${anchorDate}T12:00:00`)

    if (mode === 'day') {
      return { from: startOfDay(anchor), to: endOfDay(anchor), label: `Dia ${anchorDate}` }
    }

    if (mode === 'week') {
      const from = startOfWeek(anchor)
      const to = endOfWeek(anchor)
      return { from, to, label: `Semana ${formatDateInput(from)} al ${formatDateInput(to)}` }
    }

    if (mode === 'month') {
      const from = startOfMonth(anchor)
      const to = endOfMonth(anchor)
      return { from, to, label: `Mes ${anchor.getMonth() + 1}/${anchor.getFullYear()}` }
    }

    const from = startOfDay(new Date(`${fromDate}T12:00:00`))
    const to = endOfDay(new Date(`${toDate}T12:00:00`))
    return { from, to, label: `Rango ${fromDate} al ${toDate}` }
  }, [anchorDate, fromDate, mode, toDate])

  const listaFiltrada = useMemo(() => {
    return lista.filter((h) => {
      const inicio = new Date(h.horaIngreso)
      const fin = h.horaEgreso ? new Date(h.horaEgreso) : new Date()
      if (Number.isNaN(inicio.getTime()) || Number.isNaN(fin.getTime())) return false
      return overlapsRange(inicio, fin, range.from, range.to)
    })
  }, [lista, range.from, range.to])

  const totalHorasFiltradas = useMemo(() => {
    return getHorasRango(range.from, range.to, id)
  }, [getHorasRango, id, range.from, range.to])

  return (
    <Wood className="w-[min(960px,96vw)] text-white">
      <div className="flex items-center justify-between gap-2">
        <Title>Horarios del vendedor #{id}</Title>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p>Horas hoy: {formatHours(getHorasDia(new Date(), id))}</p>
          <p>Horas esta semana: {formatHours(getHorasSemana(new Date(), id))}</p>
          <p>Horas este mes: {formatHours(getHorasMes(new Date(), id))}</p>
          <p className="text-sm opacity-70">Total turnos cargados: {lista.length}</p>
        </div>

        <div className="rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="font-semibold">Filtro actual</p>
          <p className="text-sm opacity-80">{range.label}</p>
          <p className="mt-2 text-sm">
            Turnos encontrados: <span className="font-semibold">{listaFiltrada.length}</span>
          </p>
          <p className="text-sm">
            Horas en el filtro: <span className="font-semibold">{formatHours(totalHorasFiltradas)}</span>
          </p>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setMode('day')}
            className={`rounded-lg px-3 py-2 ${mode === 'day' ? 'bg-cyan-700' : 'bg-black/30'}`}
          >
            Dia
          </button>
          <button
            type="button"
            onClick={() => setMode('week')}
            className={`rounded-lg px-3 py-2 ${mode === 'week' ? 'bg-cyan-700' : 'bg-black/30'}`}
          >
            Semana
          </button>
          <button
            type="button"
            onClick={() => setMode('month')}
            className={`rounded-lg px-3 py-2 ${mode === 'month' ? 'bg-cyan-700' : 'bg-black/30'}`}
          >
            Mes
          </button>
          <button
            type="button"
            onClick={() => setMode('range')}
            className={`rounded-lg px-3 py-2 ${mode === 'range' ? 'bg-cyan-700' : 'bg-black/30'}`}
          >
            Rango
          </button>
        </div>

        {mode === 'range' ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-white/75">Desde</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-white outline-none focus:border-cyan-400"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-white/75">Hasta</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-white outline-none focus:border-cyan-400"
              />
            </label>
          </div>
        ) : (
          <div className="mt-3 max-w-xs">
            <label className="flex flex-col gap-1">
              <span className="text-xs uppercase tracking-[0.18em] text-white/75">
                {mode === 'day' ? 'Dia' : mode === 'week' ? 'Dia de referencia' : 'Mes de referencia'}
              </span>
              <input
                type="date"
                value={anchorDate}
                onChange={(e) => setAnchorDate(e.target.value)}
                className="rounded-lg border border-white/20 bg-black/35 px-3 py-2 text-white outline-none focus:border-cyan-400"
              />
            </label>
          </div>
        )}
      </div>

      <div className="mt-4 max-h-[60vh] overflow-y-auto rounded-md border border-white/10">
        {listaFiltrada.length === 0 ? (
          <div className="p-3 opacity-70">No hay horarios para este vendedor en el filtro seleccionado.</div>
        ) : (
          listaFiltrada.map((h) => (
            <div key={h.id} className="border-b border-white/10 p-3 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm opacity-80">Horario #{h.id}</p>
                <p className="text-sm font-semibold">{formatHours(getDurationHours(h.horaIngreso, h.horaEgreso))}</p>
              </div>
              <p>Ingreso: {new Date(h.horaIngreso).toLocaleString('es-AR')}</p>
              <p>Egreso: {h.horaEgreso ? new Date(h.horaEgreso).toLocaleString('es-AR') : 'Abierto'}</p>
            </div>
          ))
        )}
      </div>
    </Wood>
  )
}
