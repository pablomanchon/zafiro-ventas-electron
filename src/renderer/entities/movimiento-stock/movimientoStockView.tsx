// src/pages/movimiento-stock/MovimientoStockView.tsx
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'

import Main from '../../layout/Main'
import Title from '../../layout/Title'
import Steel from '../../layout/Steel'

import { useProducts } from '../../hooks/useProducts'
import { useStockMovements, type StockMove } from '../../hooks/useMovimientoStock'

export default function MovimientoStockView() {
  const { id: routeId } = useParams<{ id?: string }>()

  const { movimientos, loading, error, getById, normalizeLines } = useStockMovements()
  const { products } = useProducts()

  const [idMovimiento, setIdMovimiento] = useState<number | null>(
    routeId ? Number(routeId) : null
  )
  const [movimientoFromPayload, setMovimientoFromPayload] = useState<StockMove | null>(null)

  // 🔹 Escuchar INIT_DATA desde la ventana padre
  useEffect(() => {
    const origin = window.location.origin

    function handleMessage(event: MessageEvent) {
      if (event.origin !== origin) return
      if (event.data?.type !== 'INIT_DATA') return

      const payload = event.data.payload || {}
      if (payload.idMovimiento != null) {
        setIdMovimiento(Number(payload.idMovimiento))
      }
      if (payload.movimiento) {
        setMovimientoFromPayload(payload.movimiento as StockMove)
      }
    }

    window.addEventListener('message', handleMessage)

    // Avisar al opener que esta ventana está lista
    try {
      window.opener?.postMessage({ type: 'READY' }, origin)
    } catch {}

    // Compatibilidad con windowApi.onInitData (Electron)
    const unsubscribe = (window as any).windowApi?.onInitData?.((payload: any) => {
      if (payload?.idMovimiento != null) {
        setIdMovimiento(Number(payload.idMovimiento))
      }
      if (payload?.movimiento) {
        setMovimientoFromPayload(payload.movimiento as StockMove)
      }
    })

    return () => {
      window.removeEventListener('message', handleMessage)
      unsubscribe?.()
    }
  }, [])

  // 🔹 Movimiento efectivo (payload > hook)
  const movimiento: StockMove | null = useMemo(() => {
    if (movimientoFromPayload) return movimientoFromPayload
    if (idMovimiento != null) return getById(idMovimiento)
    return null
  }, [movimientoFromPayload, idMovimiento, getById, movimientos])

  // 🔹 Mapeo de productos para mostrar nombre a partir del id
  const productMap = useMemo(() => {
    const map = new Map<string, string>()
    products.forEach((p: any) => {
      map.set(String(p.id), p.nombre ?? String(p.id))
    })
    return map
  }, [products])

  // 🔹 Normalizamos las líneas y completamos el nombre con el productMap si falta
  const lineas = useMemo(() => {
    const base = normalizeLines(movimiento)
    return base.map((l, index) => {
      const nombre =
        l.nombre ||
        (l.idProduct != null ? productMap.get(String(l.idProduct)) ?? '' : '')
      return {
        key: index,
        idProduct: l.idProduct,
        nombre,
        quantity: l.quantity,
      }
    })
  }, [movimiento, normalizeLines, productMap])

  const fechaMovimiento = useMemo(() => {
    if (!movimiento) return ''
    const raw =
      movimiento.createdAt ??
      movimiento.fecha ??
      movimiento.date ??
      (movimiento as any).created_at ??
      null

    if (!raw) return ''
    const d = new Date(raw)
    if (isNaN(d.getTime())) return String(raw)
    return d.toLocaleString('es-AR')
  }, [movimiento])

  const tipoLabel =
    movimiento?.moveType === 'out'
      ? 'Salida (- stock)'
      : movimiento?.moveType === 'in'
      ? 'Entrada (+ stock)'
      : movimiento?.moveType ?? 'Desconocido'

  const tipoColorClasses =
    movimiento?.moveType === 'out'
      ? 'bg-red-900/60 border-red-500 text-red-200'
      : movimiento?.moveType === 'in'
      ? 'bg-emerald-900/60 border-emerald-500 text-emerald-200'
      : 'bg-slate-800/70 border-slate-500 text-slate-100'

  return (
    <Main className="flex flex-col h-screen p-4 gap-4 bg-slate-950">
      <div className="flex items-center justify-between">
        <Title className="text-white">
          Movimiento de Stock {movimiento?.id ? `#${movimiento.id}` : ''}
        </Title>
      </div>

      {error && (
        <Steel className="p-3 text-red-300 bg-red-900/30 border border-red-700">
          {String(error)}
        </Steel>
      )}

      {loading && !movimiento && (
        <Steel className="p-3 text-slate-300 bg-slate-800 border border-slate-600">
          Cargando movimiento de stock...
        </Steel>
      )}

      {!loading && !movimiento && (
        <Steel className="p-3 text-slate-300 bg-slate-800 border border-slate-600">
          No se encontró el movimiento de stock.
        </Steel>
      )}

      {movimiento && (
        <div className="flex flex-col gap-4">
          {/* Cabecera de datos generales */}
          <Steel className="flex flex-col md:flex-row justify-between gap-3 p-3 bg-slate-900/80 border border-slate-700 mt-2">
            <div className="space-y-1 text-sm text-slate-200">
              <div>
                <span className="font-semibold text-slate-100">ID:</span>{' '}
                {movimiento.id}
              </div>
              {fechaMovimiento && (
                <div>
                  <span className="font-semibold text-slate-100">Fecha:</span>{' '}
                  {fechaMovimiento}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-300">Tipo de movimiento:</span>
              <span
                className={
                  'px-3 py-1 rounded-full text-xs font-semibold border ' +
                  tipoColorClasses
                }
              >
                {tipoLabel}
              </span>
            </div>
          </Steel>

          {/* Tabla de productos */}
          <Steel className="p-3 bg-slate-900/80 border border-slate-700">
            <h2 className="text-sm font-semibold text-slate-100 mb-2">
              Productos del movimiento
            </h2>

            <div className="overflow-auto max-h-[60vh] text-white">
              <table className="w-full text-xs md:text-sm border border-slate-700 rounded-md overflow-hidden">
                <thead className="bg-slate-800">
                  <tr>
                    <th className="px-2 py-1 text-left">ID Producto</th>
                    <th className="px-2 py-1 text-left">Nombre</th>
                    <th className="px-2 py-1 text-right">Cantidad</th>
                  </tr>
                </thead>
                <tbody>
                  {lineas.length === 0 && (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-2 py-3 text-center text-slate-400"
                      >
                        Este movimiento no tiene productos asociados.
                      </td>
                    </tr>
                  )}

                  {lineas.map((l) => (
                    <tr
                      key={l.key}
                      className="border-t border-slate-700 odd:bg-slate-900/80 even:bg-slate-950/80"
                    >
                      <td className="px-2 py-1 whitespace-nowrap text-slate-200">
                        {l.idProduct ?? '-'}
                      </td>
                      <td className="px-2 py-1 text-slate-100">
                        {l.nombre || <span className="text-slate-500">Sin nombre</span>}
                      </td>
                      <td className="px-2 py-1 text-right text-slate-100">
                        {l.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Steel>
        </div>
      )}
    </Main>
  )
}
