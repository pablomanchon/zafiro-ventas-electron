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
import { useModal } from '../../providers/ModalProvider'
import MovimientoStockCreate from './movimientoStockCreate'
import MovimientoStockView from './movimientoStockView'

export default function MovimientoStockPage() {
  const { openModal, closeModal } = useModal()
  const config = crudConfigs['movimiento-stock'] as CrudConfig
  const { columns, searchFields } = config
  const { movimientos, loading, error } = useStockMovements()

  const movimientosProcesados = movimientos.map((m: any) => ({
    ...m,
    productsMoveStock: Array.isArray(m.productsMoveStock)
      ? m.productsMoveStock.map((p: any) => `${p.idProduct} x${p.quantity}`).join(', ')
      : m.productsMoveStock ?? '',
    moveType: m.moveType === 'in' ? 'Entrada' : 'Salida',
  }))

  const openMovimiento = useCallback((id: number) => {
    const movimiento = movimientos.find((m: any) => Number(m.id) === Number(id))
    openModal(
      <div className="w-[min(96vw,900px)] max-h-[90vh] overflow-y-auto">
        <MovimientoStockView idMovimiento={id} movimiento={movimiento ?? null} />
      </div>
    )
  }, [movimientos, openModal])

  const handleDobleClickFila = useCallback((id: number) => {
    openMovimiento(id)
  }, [openMovimiento])

  const handleOpenCreate = useCallback(() => {
    openModal(<MovimientoStockCreate onSuccess={closeModal} />)
  }, [openModal, closeModal])

  const scopeRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  useFocusBlocker(scopeRef, {
    allowSelector: 'input, textarea, select, [contenteditable="true"], [role="textbox"]',
  })

  return (
    <Main className="flex flex-col min-h-0 p-3 sm:p-4 gap-4">
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
            loading={loading}
            loadingTitle="Cargando movimientos"
          />
        </div>

        <Steel className="flex justify-stretch sm:justify-end bg-gray-800 p-2">
          <PrimaryButton functionClick={handleOpenCreate} title="Crear movimiento" />
        </Steel>
      </div>
    </Main>
  )
}
