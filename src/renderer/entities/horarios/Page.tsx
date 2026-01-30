// src/pages/horarios/HorariosPage.tsx
import { useEffect, useMemo, useState } from 'react'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
// import Search from '../../layout/Search' // ❌ ya no
import { Clock, LogIn, LogOut, RefreshCcw } from 'lucide-react'
// import { useSearch } from '../../providers/SearchProvider' // ❌ ya no
import { useHorarios } from './useHorarios'
import { useModal } from '../../providers/ModalProvider'
import Confirmation from '../../layout/Confirmation'
import Wood from '../../layout/Steel'
import { isValidDateValue } from '../../utils/utils'
import config from './config'
import TableAndSearch from '../../components/TableAndSearch'

export default function HorariosPage() {
  // const { search } = useSearch() // ❌ ya no
  const { horarios, loading, fetchAll, marcarIngreso, marcarEgreso } = useHorarios()
  const { openModal } = useModal()
  const { columns, searchFields } = config

  const [vendedorId, setVendedorId] = useState<number>(0)

  useEffect(() => {
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const datosConEstado = useMemo(() => {
    return horarios.map((h) => {
      const egresoValido = isValidDateValue(h.horaEgreso)

      return {
        ...h,
        horaEgreso: egresoValido ? h.horaEgreso : '-',
        estado: egresoValido ? (
          <span className="text-green-300 font-semibold">Cerrado</span>
        ) : (
          <span className="text-yellow-300 font-semibold">Abierto</span>
        ),
      }
    })
  }, [horarios])

  const onIngreso = async () => {
    if (!vendedorId || Number.isNaN(vendedorId)) return
    await marcarIngreso({ vendedorId })
  }

  const onDobleClickFila = (id: string | number) => {
    const numId = typeof id === 'string' ? Number(id) : id
    const h = horarios.find((x) => x.id === numId)
    if (!h) return
    if (h.horaEgreso) return // ya está cerrado

    openModal(
      <Confirmation
        mensaje={`Marcar egreso para ${h.vendedor?.nombre}?`}
        onConfirm={async () => {
          await marcarEgreso(h.vendedor!.id, {})
        }}
      />
    )
  }

  return (
    <Main>
      <div className="flex items-center justify-between gap-2">
        <Title className="flex items-center justify-center gap-2">
          <Clock className="" />
          Horarios
        </Title>

        <button
          onClick={fetchAll}
          className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded"
          disabled={loading}
          title="Recargar"
        >
          <RefreshCcw size={18} />
          Recargar
        </button>
      </div>

      <div className="flex flex-col gap-2 mt-3">
        {/* <Search />  ❌ lo saca TableAndSearch */}
        <Wood typeWood={3} className="flex gap-2 items-center bg-gray-900 p-2 rounded max-w-96">
          <input
            type="number"
            onKeyDown={(e) => {
              if (e.key === 'Enter') onIngreso()
            }}
            value={vendedorId || ''}
            onChange={(e) => setVendedorId(Number(e.target.value))}
            className="w-full bg-gray-800 outline-none text-white px-2 py-2 rounded shadow-inner shadow-black"
            placeholder="ID del vendedor"
          />
          <button
            onClick={onIngreso}
            disabled={loading || !vendedorId}
            className="flex border-2 border-black shadow-inner shadow-black transition-all
            hover:shadow-black items-center gap-2 font-bold bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded cursor-pointer"
            title="Marcar ingreso"
          >
            <LogIn size={18} />
            Ingreso
          </button>
        </Wood>
      </div>

      <div className="mt-3">
        <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
          <LogOut size={16} />
          Tip: doble click (o Enter) en una fila “Abierto” para marcar eg **egreso**
        </div>

        <TableAndSearch
          encabezados={columns}
          datos={datosConEstado}
          onDobleClickFila={onDobleClickFila}
          onFilaSeleccionada={() => {}}
          searchFilters={searchFields}
        />
      </div>
    </Main>
  )
}
