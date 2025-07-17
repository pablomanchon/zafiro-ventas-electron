// src/pages/CrudPage.tsx
import { useCrud } from '../hooks/useCrud';
import TableAndSearch from '../components/TableAndSearch';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import DangerButton from '../components/DangerButton';
import Title from '../layout/Title';
import Steel from '../layout/Steel';
import type { CrudConfig } from '../entities/CrudConfig';

export default function CrudPage<T extends { id: number }>({
  config,
}: {
  config: CrudConfig;
}) {
  const { entity, title, columns, formInputs, searchFields } = config;
  const { items, selected, setSelected, showForm, handleDelete } = useCrud<T>(
    entity,
    formInputs
  );

  return (
    <div className="flex flex-col h-screen p-2 w-full mt-8 md:mt-auto">
      {/* Título */}
      <Title>{title}</Title>

      {/* Contenedor central con scroll */}
      <div className="flex-1 overflow-auto">
        <TableAndSearch
          datos={items}
          encabezados={columns}
          onDobleClickFila={id =>
            showForm(items.find(i => i.id === id) ?? null)
          }
          onFilaSeleccionada={setSelected}
          searchFilters={searchFields}
        />
      </div>

      {/* Barra pegada al fondo */}
      <Steel className="flex gap-2 items-center mt-auto bg-gray-800 p-2">
        <PrimaryButton title="Crear" functionClick={() => showForm(null)} />
        {selected != null && (
          <>
            <SecondaryButton
              title="Modificar"
              functionClick={() =>
                showForm(items.find(i => i.id === selected) ?? null)
              }
            />
            <DangerButton title="Eliminar" functionClick={handleDelete} />
          </>
        )}
      </Steel>
    </div>
  );
}
