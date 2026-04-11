// src/components/EntitySearchModal.tsx
import { useState, useEffect } from 'react';
import { getAll } from '../api/crud';
import { useModal } from '../providers/ModalProvider';
import TableAndSearch from './TableAndSearch';
import PrimaryButton from './PrimaryButton';
import Glass from '../layout/Glass';
import { toast } from 'react-toastify';
import { toSingular } from '../utils/utils';

interface EntitySearchModalProps {
    entity: string;
    columns: string[];
    searchFilters: string[];
    onSelect: (id: number) => void;
}

export default function EntitySearchModal<T extends { id: number }>({
    entity,
    columns,
    searchFilters,
    onSelect,
}: EntitySearchModalProps) {
    const [items, setItems] = useState<T[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<number | null>(null); // 👈 NUEVO
    const { closeModal } = useModal();

    useEffect(() => {
        getAll<T>(entity)
            .then((res) => {
                setItems(res);
                setLoading(false);
            })
            .catch(console.error);
    }, [entity]);

    // 👇 ahora puede venir un id directo (doble click) o usamos el seleccionado
    const handleSelect = (idFromEvent?: number | null) => {
        const finalId = typeof idFromEvent === 'number' ? idFromEvent : selectedId;

        if (!finalId) {
            toast.error('Debe seleccionar un ' + toSingular(entity));
            return;
        }

        onSelect(finalId);
        closeModal();
    };

    return (
        <div className="w-[min(96vw,980px)] p-3 sm:p-4 bg-cyan-800 text-white rounded max-h-[85vh] overflow-y-auto">
            {loading ? (
                <div className="w-full sm:w-80 h-40">Cargando...</div>
            ) : (
                <>
                    <h3 className="text-lg font-bold mb-2">Buscar {entity}</h3>
                    <TableAndSearch<T>
                        datos={items}
                        encabezados={columns}
                        searchFilters={searchFilters}
                        onDobleClickFila={handleSelect}          // 👈 pasa id y cierra
                        onFilaSeleccionada={setSelectedId}       // 👈 guardamos el id seleccionado
                    />
                    <Glass className="mt-2 shadow-inner shadow-black flex justify-stretch sm:justify-center">
                        <PrimaryButton
                            title={'Seleccionar'}
                            functionClick={() => handleSelect()}  // 👈 usa el selectedId
                        />
                    </Glass>
                </>
            )}
        </div>
    );
}
