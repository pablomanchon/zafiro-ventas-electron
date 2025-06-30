import React from 'react';
import Table from '../layout/Table';
import { useSearch } from '../providers/SearchProvider';
import Search from '../layout/Search';

export default function TableAndSearch({ datos, encabezados, onDobleClickFila, onFilaSeleccionada, searchFilters }) {
    const { search } = useSearch();

    const filteredData = datos.filter((item) =>
        searchFilters.some((field) =>
            String(item[field] ?? '')
                .toLowerCase()
                .includes(search.toLowerCase())
        )
    );

    return (
        <div className="flex flex-col gap-2 p-2">
            <Search />
            <Table
                datos={filteredData}
                encabezados={encabezados}
                onDobleClickFila={onDobleClickFila}
                onFilaSeleccionada={onFilaSeleccionada}
            />
        </div>
    );
}
