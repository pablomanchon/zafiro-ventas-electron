import { useState } from 'react';
import Table from '../layout/Table';
import DynamicForm from '../layout/DynamicForm';
import SecondaryButton from '../components/SecondaryButton';
import DangerButton from '../components/DangerButton';
import useCrud from '../hooks/useCrud';

interface CrudConfig<T extends { id: number }> {
  entity: string;
  title: string;
  columns: (string | { titulo: string; clave: string })[];
  searchFields: string[];
  formInputs: any[]; // Input definitions for DynamicForm
}

export default function CrudPage<T extends { id: number }>({ config }: { config: CrudConfig<T> }) {
  const { entity, title, columns, searchFields, formInputs } = config;
  const { items, addItem, updateItem, deleteItem } = useCrud<T>(entity);
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [search, setSearch] = useState('');

  const handleSubmit = async (values: Record<string, any>) => {
    if (editing && selected != null) {
      await updateItem(selected, values);
    } else {
      await addItem(values as T);
    }
    setEditing(null);
    setSelected(null);
  };

  const handleDelete = async () => {
    if (selected == null) return;
    if (!confirm('¿Eliminar registro?')) return;
    await deleteItem(selected);
    setSelected(null);
  };

  const filtered = items.filter(item =>
    searchFields.some(f => {
      const value = f.split('.').reduce((acc, k) => (acc ? acc[k] : undefined), item);
      return String(value ?? '')
        .toLowerCase()
        .includes(search.toLowerCase());
    })
  );

  const inputs = formInputs.map(input => ({
    ...input,
    value: editing ? editing[input.name] ?? '' : undefined,
  }));

  return (
    <div className="flex flex-col gap-4 p-2 w-full overflow-auto">
      <h2 className="text-2xl font-bold">{title}</h2>

      <div className="flex gap-2 items-center">
        <input
          className="border rounded px-2 py-1 text-black"
          placeholder="Buscar..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        {selected != null && (
          <>
            <DangerButton title="Eliminar" functionClick={handleDelete} />
            <SecondaryButton title="Cancelar" functionClick={() => { setSelected(null); setEditing(null); }} />
          </>
        )}
      </div>

      <Table
        datos={filtered}
        encabezados={columns}
        onDobleClickFila={id => {
          const item = items.find(it => it.id === id);
          setEditing(item ?? null);
          setSelected(id);
        }}
        onFilaSeleccionada={id => setSelected(id)}
      />

      <DynamicForm
        inputs={inputs}
        onSubmit={handleSubmit}
        titleBtn={editing ? 'Actualizar' : 'Crear'}
      />
    </div>
  );
}
