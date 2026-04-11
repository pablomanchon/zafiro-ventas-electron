import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { formatCurrencyARS } from '../../utils/utils'

export default function SalesPage() {
  const navigate = useNavigate()
  const config = crudConfigs['ventas'] as CrudConfig
  const { columns, searchFields } = config

  const {
    ventas,
    totales,
    totalGeneral,
    loading,
    error,
    filter, setFilter, shift, goToday, label, reload,
  } = useSales('day')

  const openVenta = useCallback((id: number) => {
    const venta = ventas.find(v => Number(v.id) === Number(id))
    navigate(`/ventas/${id}`, { state: venta ? { venta, idVenta: id } : { idVenta: id } })
  }, [navigate, ventas])

  const handleDobleClickFila = useCallback((id: number | string) => {
    openVenta(Number(id))
  }, [openVenta])

  const handleOpenCreate = useCallback(() => {
    navigate('/ventas/create', { state: { from: 'ventas' } })
  }, [navigate])

  const scopeRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  useFocusBlocker(scopeRef)

  useEffect(() => {
    const ch = new BroadcastChannel('ventas')
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === 'VENTA_CREADA') reload()
    }
    ch.addEventListener('message', onMsg)
    return () => {
      ch.removeEventListener('message', onMsg)
      ch.close()
    }
  }, [reload])

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

        <div className="flex-1 overflow-auto" ref={tableRef} tabIndex={-1}>
          <TableAndSearch
            datos={loading ? [] : ventas}
            encabezados={columns}
            searchFilters={searchFields}
            onDobleClickFila={handleDobleClickFila}
            onFilaSeleccionada={() => null}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 items-stretch my-1">
          {!loading && totales.map((p) => (
            <Steel key={p.tipo} className="flex justify-between items-center max-w-96 min-w-60">
              <p className="capitalize font-bold text-lg">{p.tipo}</p>
              <p className="text-xl font-bold">{formatCurrencyARS(p.total)}</p>
            </Steel>
          ))}
          <Steel className="flex justify-between items-center max-w-96 min-w-60">
            <p className="uppercase font-bold text-lg">Total</p>
            <p className="text-xl font-bold">{!loading && formatCurrencyARS(totalGeneral)}</p>
          </Steel>
        </div>

        <Steel className="flex justify-end bg-gray-800 p-2">
          <PrimaryButton functionClick={handleOpenCreate} title="Crear" />
        </Steel>
      </div>
    </Main>
  )
}
