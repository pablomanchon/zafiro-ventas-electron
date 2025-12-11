// src/pages/MovimientoStockPage.tsx
import { useCallback, useRef } from 'react'
import type { CrudConfig } from '../CrudConfig'
import { crudConfigs } from '..'

import Main from '../../layout/Main'
import Title from '../../layout/Title'
import Steel from '../../layout/Steel'
import PrimaryButton from '../../components/PrimaryButton'
import TableAndSearch from '../../components/TableAndSearch'
import { useFocusBlocker } from '../../hooks/useFocusBlocker'
import { useStockMovements } from '../../hooks/useMovimientoStock'

export default function MovimientoStockPage() {
  const config = crudConfigs['movimiento-stock'] as CrudConfig
  const { columns, searchFields } = config

  const {
    movimientos,
    loading,
    error,
  } = useStockMovements()

  // 🔹 Transformamos productsMoveStock (array de objetos) a string
  const movimientosProcesados = (loading ? [] : movimientos).map((m: any) => ({
    ...m,
    productsMoveStock: Array.isArray(m.productsMoveStock)
      ? m.productsMoveStock
        .map((p: any) => `${p.idProduct} x${p.quantity}`)
        .join(', ')
      : m.productsMoveStock ?? '',
    moveType: m.moveType == 'in' ? "Entrada" : "Salida"
  }))

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

  const openMovimiento = useCallback(
    (id: number) => {
      const movimiento = movimientos.find((m: any) => Number(m.id) === Number(id))
      const payload = movimiento ? { movimiento, idMovimiento: id } : { idMovimiento: id }
      openChildWithPayload(`#/movimiento-stock/${id}`, payload)
    },
    [movimientos, openChildWithPayload]
  )

  const handleDobleClickFila = useCallback(
    (id: number) => {
      openMovimiento(id)
    },
    [openMovimiento]
  )

  const handleOpenCreate = useCallback(() => {
    openChildWithPayload('#/movimiento-stock/create', { from: 'movimiento-stock' })
  }, [openChildWithPayload])

  const scopeRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  useFocusBlocker(scopeRef)

  return (
    <Main className="flex flex-col h-screen p-4 gap-4">
      <div
        ref={scopeRef}
        tabIndex={0}
        className="flex flex-col h-full outline-none focus:outline-none"
      >
        <Title className="mb-2">Movimientos de Stock</Title>

        {error && (
          <Steel className="p-3 text-red-300 bg-red-900/30 border border-red-700">
            {String(error)}
          </Steel>
        )}

        <div className="flex-1 overflow-auto" ref={tableRef} tabIndex={-1}>
          <TableAndSearch
            datos={movimientosProcesados}
            encabezados={columns}
            searchFilters={searchFields}
            onDobleClickFila={handleDobleClickFila}
            onFilaSeleccionada={() => null}
          />
        </div>

        <Steel className="flex justify-end bg-gray-800 p-2">
          <PrimaryButton functionClick={handleOpenCreate} title="Crear movimiento" />
        </Steel>
      </div>
    </Main>
  )
}
