import { useState, useEffect } from 'react';
import { useModal } from '../../providers/ModalProvider';
import { getAll } from '../../api/crud';
import EntitySearchModal from '../../components/EntitySearchModal';

interface Cliente {
  id: number;
  nombre: string;
  [key: string]: any;
}

interface Props {
  value: number | null;
  onChange: (value: number) => void;
  label?: string;
}

export default function ClienteSelectInput({ value, onChange, label }: Props) {
  const { openModal } = useModal();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [selected, setSelected] = useState<Cliente | null>(null);

  // Carga todos los clientes para lookup de nombre
  useEffect(() => {
    getAll<Cliente>('clientes').then(setClientes).catch(console.error);
  }, []);

  // Cuando cambia el ID seleccionado, actualizamos `selected`
  useEffect(() => {
    const cli = clientes.find(c => c.id === value) || null;
    setSelected(cli);
  }, [value, clientes]);

  const handleSelect = (id: number) => {
    onChange(id);
    // el modal cierra automáticamente
  };

  const openSearch = () => {
    openModal(
      <EntitySearchModal
        entity="clientes"
        columns={['ID', 'Nombre', 'Email']}
        searchFilters={['nombre', 'email']}
        onSelect={handleSelect}
      />
    );
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="font-semibold">{label}:</span>}
      <input
        readOnly
        value={ selected ? `${selected.id} - ${selected.nombre}` : '' }
        placeholder="Seleccione cliente"
        className="flex-1 border rounded px-2 py-1 bg-gray-700 text-white cursor-pointer"
        onClick={openSearch}
      />
      <button
        type="button"
        onClick={openSearch}
        className="p-1 bg-cyan-600 rounded hover:bg-cyan-500 text-white"
      >
        Buscar
      </button>
    </div>
  );
}
