// src/components/EntitySearchModal.tsx
import { useState, useEffect } from 'react';
import { getAll } from '../api/crud';                   // list API :contentReference[oaicite:1]{index=1}
import { useModal } from '../providers/ModalProvider';  // manejar modal :contentReference[oaicite:2]{index=2}
import TableAndSearch from './TableAndSearch';

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
    const { closeModal } = useModal();
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        getAll<T>(entity).then((res) => {
            setItems(res)
            setLoading(false)
        }
        ).catch(console.error);
    }, [entity]);

    const handleSelect = (id: number) => {
        onSelect(id);
        closeModal();
    };

    return (
        <div className="p-4 bg-cyan-800 text-white rounded max-h-screen overflow-y-auto">
            {loading ?
                <div className='w-80 h-40'>Cargando...</div>
                :
                <>
                    <h3 className="text-lg font-bold mb-2">Buscar {entity}</h3>
                    <TableAndSearch<T>
                        datos={items}
                        encabezados={columns}
                        searchFilters={searchFilters}
                        onDobleClickFila={handleSelect}
                        onFilaSeleccionada={() => { }}
                    />
                </>
            }
        </div>
    );
}
