// src/pages/SalesPage.tsx
import { useCallback, useEffect, useRef } from 'react'
import type { CrudConfig } from '../CrudConfig'
import { crudConfigs } from '..'

import Main from '../../layout/Main'
import Title from '../../layout/Title'
import Steel from '../../layout/Steel'
import PrimaryButton from '../../components/PrimaryButton'
import TableAndSearch from '../../components/TableAndSearch'
import { DateNavigator } from '../../hooks/useDate'
import { useFocusBlocker } from '../../hooks/useFocusBlocker'
import useSales from '../../hooks/useSales'
import { formatCurrencyARS } from '../../utils'

export default function SalesPage() {
  const config = crudConfigs['ventas'] as CrudConfig
  const { columns, searchFields } = config

  const {
    ventas,
    totales,
    totalGeneral,
    loading,
    error,
    filter, setFilter, shift, goToday, label, reload
  } = useSales('day')

  const openChildWithPayload = useCallback((hashRoute: string, payload?: unknown) => {
    if (window.windowApi?.openChild) {
      window.windowApi.openChild(hashRoute, payload).catch((err: unknown) => {
        console.error('No se pudo abrir la ventana desde el proceso main', err)
      })
      return
    }

    const child = window.open(hashRoute, '_blank', 'noopener,noreferrer')
    if (!child) return
    const childWindow = child

    const origin = window.location.origin
    let intervalId: number | null = null

    function cleanup() {
      window.removeEventListener('message', handleReady)
      if (intervalId !== null) {
        window.clearInterval(intervalId)
        intervalId = null
      }
    }

    function handleReady(event: MessageEvent) {
      if (event.source !== childWindow) return
      if (event.origin !== origin) return
      if (event.data?.type === 'READY') {
        childWindow.postMessage({ type: 'INIT_DATA', payload }, origin)
        cleanup()
      }
    }

    window.addEventListener('message', handleReady)

    intervalId = window.setInterval(() => {
      if (childWindow.closed) cleanup()
    }, 500)
  }, [])

  const openVenta = useCallback((id: number) => {
    const venta = ventas.find(v => Number(v.id) === Number(id))
    const payload = venta ? { venta, idVenta: id } : { idVenta: id }
    openChildWithPayload(`#/ventas/${id}`, payload)
  }, [ventas, openChildWithPayload])

  const handleDobleClickFila = useCallback((id: number) => {
    openVenta(id)
  }, [openVenta])

  const handleOpenCreate = useCallback(() => {
    openChildWithPayload('#/ventas/create', { from: 'ventas' })
  }, [openChildWithPayload])

  const scopeRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  useFocusBlocker(scopeRef)

  useEffect(() => {
    const ch = new BroadcastChannel('ventas')
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'VENTA_CREADA') {
        // forzar un refetch usando setFilter igual a sí mismo
        reload()
      }
    }
    ch.addEventListener('message', onMsg)
    return () => {
      ch.removeEventListener('message', onMsg)
      ch.close()
    }
  }, [setFilter])

  return (
    <Main className="flex flex-col h-screen p-4 gap-4">
      <div
        ref={scopeRef}
        tabIndex={0}
        className="flex flex-col h-full outline-none focus:outline-none"
      >
        <Title className="mb-2">Ventas</Title>

        <DateNavigator
          filter={filter}
          setFilter={setFilter}
          shift={shift}
          goToday={goToday}
          label={label}
        />

        {error && (
          <Steel className="p-3 text-red-300 bg-red-900/30 border border-red-700">
            {error}
          </Steel>
        )}
        {loading && (
          <Steel className="p-3 opacity-80">Cargando…</Steel>
        )}

        <div className="flex-1 overflow-auto" ref={tableRef} tabIndex={-1}>
          <TableAndSearch
            datos={ventas}
            encabezados={columns}
            searchFilters={searchFields}
            onDobleClickFila={handleDobleClickFila}
            onFilaSeleccionada={() => null}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 items-stretch my-1">
          {totales.map((p) => (
            <Steel key={p.tipo} className="flex justify-between items-center max-w-96 min-w-60">
              <p className="capitalize font-bold text-lg">{p.tipo}</p>
              <p className="text-xl font-bold">{formatCurrencyARS(p.total)}</p>
            </Steel>
          ))}
          <Steel className="flex justify-between items-center max-w-96 min-w-60">
            <p className="uppercase font-bold text-lg">Total</p>
            <p className="text-xl font-bold">{formatCurrencyARS(totalGeneral)}</p>
          </Steel>
        </div>

        <Steel className="flex justify-end bg-gray-800 p-2">
          <PrimaryButton functionClick={handleOpenCreate} title="Crear" />
        </Steel>
      </div>
    </Main>
  )
}
