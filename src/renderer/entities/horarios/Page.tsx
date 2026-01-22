// src/pages/horarios/HorariosPage.tsx
import { useEffect, useMemo, useState } from 'react'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import Search from '../../layout/Search'
import { Clock, LogIn, LogOut, RefreshCcw } from 'lucide-react'
import { useSearch } from '../../providers/SearchProvider'
import { useHorarios } from './useHorarios'
import Table from '../../layout/Table'
import { useModal } from '../../providers/ModalProvider'
import Confirmation from '../../layout/Confirmation'

export default function HorariosPage() {
  const { search } = useSearch()
  const { horarios, loading, fetchAll, marcarIngreso, marcarEgreso } = useHorarios()
  const { openModal } = useModal()

  const [vendedorId, setVendedorId] = useState<number>(0)

  useEffect(() => {
    // si tu backend no tiene GET /horarios, esto va a setear error pero la pantalla sigue funcionando
    fetchAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const datos = useMemo(() => {
    const q = (search ?? '').trim().toLowerCase()
    if (!q) return horarios

    return horarios.filter((h) => {
      const vend = h.vendedor?.nombre?.toLowerCase() ?? ''
      const idStr = String(h.id)
      return vend.includes(q) || idStr.includes(q)
    })
  }, [horarios, search])

  const encabezados = useMemo(
    () => [
      { titulo: 'ID', clave: 'vendedor.id' },
      { titulo: 'Vendedor', clave: 'vendedor.nombre' },
      { titulo: 'Hora Ingreso', clave: 'horaIngreso' }, // Table detecta "fecha" por key; acá lo dejamos así (muestra string si no parsea)
      { titulo: 'Hora Egreso', clave: 'horaEgreso' },
      {
        titulo: 'Estado',
        clave: 'estado',
      },
    ],
    []
  )

  const datosConEstado = useMemo(() => {
    return datos.map((h) => ({
      ...h,
      estado: h.horaEgreso ? (
        <span className="text-green-300 font-semibold">Cerrado</span>
      ) : (
        <span className="text-yellow-300 font-semibold">Abierto</span>
      ),
    }))
  }, [datos])

  const onIngreso = async () => {
    if (!vendedorId || Number.isNaN(vendedorId)) return
    await marcarIngreso({ vendedorId })
  }

  const onDobleClickFila = async (id: number) => {
    const h = horarios.find((x) => x.id === id)
    if (!h) return
    if (h.horaEgreso) return // ya está cerrado
    openModal(
      <Confirmation
        mensaje={`Marcar egreso para ${h.vendedor?.nombre}?`}
        onConfirm={async () => { await marcarEgreso(h.vendedor!.id, {}) }}
      />
    )
  }

  return (
    <Main>
      <div className="flex items-center justify-between gap-2">
        <Title className="flex items-center gap-2">
          <Clock />
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

      <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
        <div className="md:col-span-2">
          <Search />
        </div>

        <div className="flex gap-2 items-center bg-gray-900 p-2 rounded">
          <input
            type="number"
            value={vendedorId || ''}
            onChange={(e) => setVendedorId(Number(e.target.value))}
            className="w-full bg-gray-800 outline-none text-white px-2 py-2 rounded"
            placeholder="Vendedor ID"
          />
          <button
            onClick={onIngreso}
            disabled={loading || !vendedorId}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-2 rounded"
            title="Marcar ingreso"
          >
            <LogIn size={18} />
            Ingreso
          </button>
        </div>
      </div>

      <div className="mt-3">
        <div className="text-xs text-gray-300 mb-2 flex items-center gap-2">
          <LogOut size={16} />
          Tip: doble click (o Enter) en una fila “Abierto” para marcar eg **egreso**
        </div>

        <Table
          encabezados={encabezados}
          datos={datosConEstado}
          onDobleClickFila={onDobleClickFila}
          formatoFecha="fecha-hora"
          onFilaSeleccionada={null}
        />
      </div>
    </Main>
  )
}
