import Table from '../layout/Table';
import { useSearch } from '../providers/SearchProvider';
import Search from '../layout/Search';

interface TableAndSearchProps<T> {
  datos: T[];
  encabezados: any[];
  onDobleClickFila: (id: number | string) => void;
  onFilaSeleccionada: (id: number | string | null) => void;
  searchFilters: string[];
}

export default function TableAndSearch<T extends { id: number | string }>({
  datos,
  encabezados,
  onDobleClickFila,
  onFilaSeleccionada,
  searchFilters,
}: TableAndSearchProps<T>) {
  const { search } = useSearch();

  const filteredData = datos.filter(item =>
    searchFilters.some(field =>
      String((item as any)[field] ?? '')
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
