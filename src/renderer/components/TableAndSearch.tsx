import Table from '../layout/Table';
import { useSearch } from '../providers/SearchProvider';
import Search from '../layout/Search';
import { useEffect } from 'react';

interface TableAndSearchProps<T extends { id: number | string }> {
  datos: T[];
  encabezados: any[];
  onDobleClickFila: (id: T['id']) => void;
  onFilaSeleccionada: (id: T['id'] | null) => void;
  searchFilters: string[];
}

export default function TableAndSearch<T extends { id: number | string }>({
  datos,
  encabezados,
  onDobleClickFila,
  onFilaSeleccionada,
  searchFilters,
}: TableAndSearchProps<T>) {
  const { search, setSearch } = useSearch();
  useEffect(() => {
    setSearch(""); // o null
  }, [setSearch]);

  function getValue(obj: any, path: string) {
    return path.split('.').reduce((acc, k) => acc?.[k], obj)
  }


  const filteredData = datos.filter(item =>
    searchFilters.some(field =>
      String(getValue(item, field) ?? '')
        .toLowerCase()
        .includes((search ?? '').toLowerCase())
    )
  )


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
