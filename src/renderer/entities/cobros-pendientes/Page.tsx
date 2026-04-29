import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { supabase } from '../../api/supabase'
import { getAll } from '../../api/crud'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import Steel from '../../layout/Steel'
import { useModal } from '../../providers/ModalProvider'
import { formatCurrencyARS } from '../../utils/utils'
import LoadingState from '../../components/LoadingState'

interface PagoPendiente {
  id: number
  monto: number
  metodo: { id: string; nombre: string; tipo: string }
}

interface VentaPendiente {
  id: number
  fecha: string
  total: number
  cliente: { id: number; nombre: string; apellido: string }
  vendedor: { id: number; nombre: string } | null
  pagosPendientes: PagoPendiente[]
}

interface MetodoPago {
  id: string
  nombre: string
  tipo: string
}

interface PagoRow {
  metodoId: string
  monto: string
  cuotas: string
}

const EMPTY_ROW = (): PagoRow => ({ metodoId: '', monto: '', cuotas: '' })

function ModalCobrar({
  venta,
  metodos,
  onDone,
}: {
  venta: VentaPendiente
  metodos: MetodoPago[]
  onDone: () => void
}) {
  const { closeModal } = useModal()
  const [rows, setRows] = useState<PagoRow[]>([EMPTY_ROW()])
  const [saving, setSaving] = useState(false)

  const totalPendiente = venta.pagosPendientes.reduce(
    (s, p) => s + Number(p.monto),
    0
  )

  const totalIngresado = rows.reduce((s, r) => {
    const v = parseFloat(r.monto.replace(',', '.'))
    return s + (isNaN(v) ? 0 : v)
  }, 0)

  const restante = Math.max(0, totalPendiente - totalIngresado)

  const updateRow = (idx: number, patch: Partial<PagoRow>) => {
    setRows((prev) => prev.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const removeRow = (idx: number) => {
    setRows((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== idx) : prev))
  }

  const handleConfirmar = async () => {
    if (totalIngresado <= 0) {
      toast.error('Ingresá al menos un monto mayor a 0')
      return
    }
    if (totalIngresado > totalPendiente + 0.01) {
      toast.error('El total supera el monto pendiente')
      return
    }
    for (const r of rows) {
      if (!r.metodoId) {
        toast.error('Seleccioná un método de pago para cada fila')
        return
      }
      const v = parseFloat(r.monto.replace(',', '.'))
      if (isNaN(v) || v <= 0) {
        toast.error('Todos los montos deben ser mayores a 0')
        return
      }
    }

    const nuevosPagos = rows.map((r) => {
      const metodo = metodos.find((m) => m.id === r.metodoId)
      return {
        metodoId: r.metodoId,
        monto: parseFloat(r.monto.replace(',', '.')),
        cuotas:
          metodo?.tipo === 'credito' && r.cuotas
            ? parseInt(r.cuotas, 10)
            : null,
      }
    })

    setSaving(true)
    try {
      const { error } = await supabase.rpc('venta_pendientes_cobrar', {
        p_venta_id: venta.id,
        p_nuevos_pagos: nuevosPagos,
      })
      if (error) throw new Error(error.message)

      const msg =
        restante > 0.01
          ? `Cobro registrado. Quedan pendientes ${formatCurrencyARS(restante)}`
          : `Venta #${venta.id} cobrada completamente`
      toast.success(msg)
      onDone()
      closeModal()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cobrar')
    } finally {
      setSaving(false)
    }
  }

  const metodosNoSoloPendiente = metodos.filter((m) => m.tipo !== 'pendiente')

  return (
    <div className="w-[min(96vw,600px)] p-4 text-white flex flex-col gap-4">
      {/* Cabecera */}
      <div>
        <h2 className="text-lg font-bold mb-0.5">Cobrar Venta #{venta.id}</h2>
        <p className="text-sm text-white/60">
          {venta.cliente.nombre} {venta.cliente.apellido}
          {venta.vendedor ? ` · ${venta.vendedor.nombre}` : ''}
          {' · '}
          {new Date(venta.fecha).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: '2-digit',
          })}
        </p>
      </div>

      {/* Resumen del pendiente */}
      <Steel typeWood={2} className="flex justify-between items-center px-4 py-2">
        <span className="text-sm text-white/70">Total pendiente</span>
        <span className="font-bold text-amber-300 text-lg">
          {formatCurrencyARS(totalPendiente)}
        </span>
      </Steel>

      {/* Filas de pago */}
      <div className="flex flex-col gap-2">
        <p className="text-xs text-white/50 uppercase tracking-wide">
          Distribuí el cobro en uno o varios métodos
        </p>

        {rows.map((row, idx) => {
          const metodoSel = metodos.find((m) => m.id === row.metodoId)
          return (
            <div
              key={idx}
              className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-700 bg-slate-800/60 px-3 py-2"
            >
              {/* Método */}
              <div className="flex-1 min-w-[160px]">
                <label className="text-xs text-white/50 block mb-1">Método</label>
                <select
                  className="w-full rounded bg-slate-700 border border-slate-600 text-white px-2 py-1.5 text-sm"
                  value={row.metodoId}
                  onChange={(e) => updateRow(idx, { metodoId: e.target.value, cuotas: '' })}
                >
                  <option value="">Seleccionar...</option>
                  {metodosNoSoloPendiente.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Monto */}
              <div className="w-32">
                <label className="text-xs text-white/50 block mb-1">Monto</label>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0"
                  className="w-full rounded bg-slate-700 border border-slate-600 text-white px-2 py-1.5 text-sm text-right"
                  value={row.monto}
                  onChange={(e) => updateRow(idx, { monto: e.target.value })}
                  onFocus={(e) => e.currentTarget.select()}
                />
              </div>

              {/* Cuotas (solo crédito) */}
              {metodoSel?.tipo === 'credito' && (
                <div className="w-20">
                  <label className="text-xs text-white/50 block mb-1">Cuotas</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="1"
                    className="w-full rounded bg-slate-700 border border-slate-600 text-white px-2 py-1.5 text-sm text-center"
                    value={row.cuotas}
                    onChange={(e) => updateRow(idx, { cuotas: e.target.value })}
                  />
                </div>
              )}

              {/* Eliminar */}
              <button
                type="button"
                onClick={() => removeRow(idx)}
                disabled={rows.length === 1}
                className="mb-0.5 rounded p-1.5 text-red-400 hover:bg-red-900/40 disabled:opacity-25 transition"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        })}

        <button
          type="button"
          onClick={() => setRows((prev) => [...prev, EMPTY_ROW()])}
          className="flex items-center gap-1.5 text-sm text-cyan-400 hover:text-cyan-300 transition w-fit"
        >
          <Plus size={14} /> Agregar método
        </button>
      </div>

      {/* Totalizador */}
      <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm flex flex-col gap-1">
        <div className="flex justify-between text-white/70">
          <span>Cobrado ahora</span>
          <span className="font-semibold text-emerald-400">
            {formatCurrencyARS(totalIngresado)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className={restante > 0.01 ? 'text-amber-300' : 'text-white/50'}>
            {restante > 0.01 ? 'Quedará pendiente' : 'Queda pendiente'}
          </span>
          <span className={`font-bold ${restante > 0.01 ? 'text-amber-300' : 'text-white/40'}`}>
            {formatCurrencyARS(restante)}
          </span>
        </div>
      </div>

      {/* Acciones */}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={closeModal}
          className="px-4 py-2 rounded-lg border border-white/15 bg-white/10 text-sm font-semibold hover:bg-white/20 transition"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={() => void handleConfirmar()}
          disabled={saving || totalIngresado <= 0}
          className="px-4 py-2 rounded-lg bg-emerald-700 text-sm font-semibold hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {saving ? 'Guardando...' : restante > 0.01 ? 'Cobrar parcialmente' : 'Confirmar cobro'}
        </button>
      </div>
    </div>
  )
}

export default function PageCobrosPendientes() {
  const { openModal } = useModal()
  const [pendientes, setPendientes] = useState<VentaPendiente[]>([])
  const [metodos, setMetodos] = useState<MetodoPago[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [{ data, error: rpcError }, metodosData] = await Promise.all([
        supabase.rpc('pendientes_listar'),
        getAll<MetodoPago>('metodo-pago'),
      ])
      if (rpcError) throw new Error(rpcError.message)
      setPendientes((data as VentaPendiente[]) ?? [])
      setMetodos(metodosData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar pendientes')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const totalPendienteGlobal = pendientes.reduce(
    (acc, v) => acc + v.pagosPendientes.reduce((s, p) => s + Number(p.monto), 0),
    0
  )

  const handleCobrar = (venta: VentaPendiente) => {
    openModal(
      <ModalCobrar venta={venta} metodos={metodos} onDone={() => void cargar()} />
    )
  }

  return (
    <Main className="flex flex-col min-h-0 p-3 sm:p-4 gap-4">
      <Title>Cobros Pendientes</Title>

      {error && (
        <Steel className="p-3 text-red-300 bg-red-900/30 border border-red-700">
          {error}
        </Steel>
      )}

      {loading ? (
        <LoadingState
          title="Cargando pendientes"
          message="Buscando ventas con pagos pendientes."
          className="m-3"
        />
      ) : pendientes.length === 0 ? (
        <Steel className="p-6 text-center text-white/60">
          No hay ventas con pagos pendientes.
        </Steel>
      ) : (
        <>
          <div className="overflow-auto rounded-lg border border-slate-700">
            <table className="w-full min-w-[560px] text-sm text-white">
              <thead className="bg-slate-800 text-white/60 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Venta</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-right">Total venta</th>
                  <th className="px-4 py-3 text-right">Pendiente</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pendientes.map((v) => {
                  const montoPendiente = v.pagosPendientes.reduce(
                    (s, p) => s + Number(p.monto),
                    0
                  )
                  return (
                    <tr
                      key={v.id}
                      className="border-t border-slate-700 odd:bg-slate-900/60 even:bg-slate-950/60 hover:bg-cyan-900/20 transition"
                    >
                      <td className="px-4 py-3 font-semibold text-white/80">#{v.id}</td>
                      <td className="px-4 py-3 text-white/60">
                        {new Date(v.fecha).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3">
                        {v.cliente.nombre} {v.cliente.apellido}
                      </td>
                      <td className="px-4 py-3 text-right text-white/70">
                        {formatCurrencyARS(v.total)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-amber-300">
                        {formatCurrencyARS(montoPendiente)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleCobrar(v)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-700 text-xs font-bold hover:bg-emerald-600 transition shadow shadow-black/40"
                        >
                          Cobrar
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <Steel className="flex justify-between items-center px-4 py-3">
            <p className="font-bold text-white/60 uppercase text-sm tracking-wide">
              Total pendientes
            </p>
            <p className="text-xl font-bold text-amber-300">
              {formatCurrencyARS(totalPendienteGlobal)}
            </p>
          </Steel>
        </>
      )}
    </Main>
  )
}
