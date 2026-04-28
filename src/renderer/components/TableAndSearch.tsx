import Table from '../layout/Table';
import { useSearch } from '../providers/SearchProvider';
import Search from '../layout/Search';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

interface TableAndSearchProps<T extends { id: number | string }> {
  datos: T[];
  encabezados: any[];
  onDobleClickFila: (id: T['id']) => void;
  onFilaSeleccionada: (id: T['id'] | null) => void;
  searchFilters: string[];
  renderMobileItem?: (item: T) => ReactNode;
}

export default function TableAndSearch<T extends { id: number | string }>({
  datos,
  encabezados,
  onDobleClickFila,
  onFilaSeleccionada,
  searchFilters,
  renderMobileItem,
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
      {renderMobileItem && (
        <div className="flex flex-col gap-2 sm:hidden">
          {filteredData.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onDobleClickFila(item.id)}
              className="w-full text-left"
            >
              {renderMobileItem(item)}
            </button>
          ))}
        </div>
      )}

      <div className={renderMobileItem ? 'hidden sm:block' : undefined}>
        <Table
          datos={filteredData}
          encabezados={encabezados}
          onDobleClickFila={onDobleClickFila}
          onFilaSeleccionada={onFilaSeleccionada}
        />
      </div>
    </div>
  );
}
