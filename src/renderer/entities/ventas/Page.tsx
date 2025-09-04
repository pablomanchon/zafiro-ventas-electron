// src/pages/SalesPage.tsx
import { useState, useEffect, useRef } from 'react'
import type { CrudConfig } from '../CrudConfig'
import { crudConfigs } from '..'
import { getAll } from '../../api/crud'
import Main from '../../layout/Main'
import Title from '../../layout/Title'
import TableAndSearch from '../../components/TableAndSearch'
import Steel from '../../layout/Steel'
import PrimaryButton from '../../components/PrimaryButton'
import { DateNavigator, useDateRange } from '../../hooks/useDate'
import { useFocusBlocker } from '../../hooks/useFocusBlocker'

export default function SalesPage() {
  const config = crudConfigs['ventas'] as CrudConfig
  const { columns, searchFields } = config

  // ⬇️ scope real (NO "contents")
  const scopeRef = useRef<HTMLDivElement>(null)
  useFocusBlocker(scopeRef)

  const { filter, setFilter, range, shift, goToday, label } = useDateRange('day')
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    getAll('ventas', range).then(res => setData(res))
  }, [range])

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

        <div className="flex-1 overflow-auto">
          <TableAndSearch
            datos={data}
            encabezados={columns}
            searchFilters={searchFields}
            onDobleClickFila={() => null}
            onFilaSeleccionada={() => null}
          />
        </div>

        <Steel className="flex justify-end bg-gray-800 p-2">
          <a
            href={`#/ventas/create`}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={-1}                          // evita que TAB caiga aquí
            onMouseDown={(e) => e.preventDefault()}// evita que el click le dé foco
            onClick={(e) => (e.currentTarget as HTMLAnchorElement).blur()} // por si acaso
          >
            <PrimaryButton functionClick={() => null} title="Crear" />
          </a>
        </Steel>
      </div>
    </Main>
  )
}
