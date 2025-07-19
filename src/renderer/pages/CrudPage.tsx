// src/pages/CrudPage.tsx
/// <reference lib="dom" />
import { useCrud } from '../hooks/useCrud'
import TableAndSearch from '../components/TableAndSearch'
import PrimaryButton from '../components/PrimaryButton'
import SecondaryButton from '../components/SecondaryButton'
import DangerButton from '../components/DangerButton'
import Title from '../layout/Title'
import Steel from '../layout/Steel'
import Main from '../layout/Main'
import type { CrudConfig } from '../entities/CrudConfig'

export default function CrudPage<T extends { id: number }>({
  config,
}: {
  config: CrudConfig
}) {
  const { entity, title, columns, formInputs, searchFields } = config
  const { items, selected, setSelected, handleDelete } = useCrud<T>(
    entity,
    formInputs
  )

  return (
    <Main className="flex flex-col h-screen p-2 w-full mt-8 md:mt-auto">
      {/* Cabecera */}
      <Title>{title}</Title>

      {/* Tabla y búsqueda */}
      <div className="flex-1 overflow-auto">
        <TableAndSearch
          datos={items}
          encabezados={columns}
          onDobleClickFila={rowId =>
            // abre edición en ventana aparte
            window.open(`#/crud/${entity}/edit/${rowId}`, '_blank')
          }
          onFilaSeleccionada={setSelected}
          searchFilters={searchFields}
        />
      </div>

      {/* Barra de acciones */}
      <Steel className="flex gap-2 items-center mt-auto bg-gray-800 p-2">
        {/* Crear en nueva ventana */}
        <a
          href={`#/crud/${entity}/create`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <PrimaryButton title="Crear" functionClick={() => {}} />
        </a>

        {selected != null && (
          <>
            {/* Modificar en nueva ventana */}
            <a
              href={`#/crud/${entity}/edit/${selected}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <SecondaryButton title="Modificar" functionClick={() => {}} />
            </a>

            {/* Eliminar siga usando el modal */}
            <DangerButton title="Eliminar" functionClick={handleDelete} />
          </>
        )}
      </Steel>
    </Main>
  )
}
