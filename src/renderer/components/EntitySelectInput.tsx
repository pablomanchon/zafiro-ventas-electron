// src/components/EntitySelectInput.tsx
import { useModal } from '../providers/ModalProvider';
import EntitySearchModal from './EntitySearchModal';

interface EntitySelectInputProps {
  value: number | null;
  onChange: (value: number) => void;
  entity: string;
  columns: string[];
  searchFilters: string[];
  label?: string;
}

export default function EntitySelectInput({
  value,
  onChange,
  entity,
  columns,
  searchFilters,
  label,
}: EntitySelectInputProps) {
  const { openModal } = useModal();

  const openSearch = () => {
    openModal(
      <EntitySearchModal
        entity={entity}
        columns={columns}
        searchFilters={searchFilters}
        onSelect={onChange}
      />
    );
  };

  return (
    <div className="flex items-center gap-2">
      {label && <span className="font-semibold">{label}:</span>}
      <input
        readOnly
        value={value ?? ''}
        placeholder={`Seleccione ${entity}`}
        className="flex-1 border rounded px-2 py-1 bg-gray-700 text-white cursor-pointer"
        onClick={openSearch}
      />
      <button
        type="button"
        onClick={openSearch}
        className="p-1 bg-cyan-600 rounded hover:bg-cyan-500"
      >
        Buscar
      </button>
    </div>
  );
}
