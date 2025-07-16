import { useEffect, useState, type SetStateAction } from 'react';
import Table from '../layout/Table';
import DynamicForm from '../layout/DynamicForm';
import SecondaryButton from '../components/SecondaryButton';
import DangerButton from '../components/DangerButton';
import { getAll, create, update, remove } from '../api/crud';
import type { CrudConfig } from '../entities/CrudConfig';
import Title from '../layout/Title';

export default function CrudPage({ config }: { config: CrudConfig }) {
  const { entity, title, columns, searchFields, formInputs } = config;
  const [items, setItems] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [search, setSearch] = useState('');

  const fetchItems = async () => {
    try {
      const data = await getAll(entity);
      setItems(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (values: any) => {
    try {
      if (editing) {
        await update(entity, editing.id, values);
      } else {
        await create(entity, values);
      }
      setEditing(null);
      setSelected(null);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    if (selected == null) return;
    if (!confirm('¿Eliminar registro?')) return;
    try {
      await remove(entity, selected);
      setSelected(null);
      fetchItems();
    } catch (err) {
      console.error(err);
    }
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
      <Title>{title}</Title>

      <div className="flex gap-2 items-center">
        <input
          className="border rounded px-2 py-1 text-black w-full outline-none"
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
        onDobleClickFila={(id: SetStateAction<number | null>) => {
          const item = items.find(it => it.id === id);
          setEditing(item ?? null);
          setSelected(id);
        }}
        onFilaSeleccionada={(id: SetStateAction<number | null>) => setSelected(id)}
      />

      <DynamicForm
        inputs={inputs}
        onSubmit={handleSubmit}
        titleBtn={editing ? 'Actualizar' : 'Crear'}
      />
    </div>
  );
}
