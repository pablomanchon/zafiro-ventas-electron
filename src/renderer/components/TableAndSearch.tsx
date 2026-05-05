import Table from '../layout/Table';
import { useSearch } from '../providers/SearchProvider';
import Search from '../layout/Search';
import { useEffect } from 'react';
import type { ReactNode } from 'react';
import LoadingState from './LoadingState';

interface TableAndSearchProps<T extends { id: number | string }> {
  datos: T[];
  encabezados: any[];
  onDobleClickFila: (id: T['id']) => void;
  onFilaSeleccionada: (id: T['id'] | null) => void;
  searchFilters: string[];
  renderMobileItem?: (item: T) => ReactNode;
  onMobileItemClick?: (id: T['id']) => void;
  mobileColumns?: 1 | 2;
  selectedId?: T['id'] | null;
  loading?: boolean;
  loadingTitle?: string;
  emptyMessage?: string;
  rowClassName?: (item: T, index: number) => string;
}

export default function TableAndSearch<T extends { id: number | string }>({
  datos,
  encabezados,
  onDobleClickFila,
  onFilaSeleccionada,
  searchFilters,
  renderMobileItem,
  onMobileItemClick,
  mobileColumns = 1,
  selectedId,
  loading = false,
  loadingTitle = 'Cargando datos',
  emptyMessage = 'No hay datos para mostrar.',
  rowClassName,
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
        <div className={`sm:hidden grid gap-2 ${mobileColumns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {loading ? (
            <div className={mobileColumns === 2 ? 'col-span-2' : ''}>
              <LoadingState variant="table" title={loadingTitle} message="Esto va a tomar solo un momento." />
            </div>
          ) : filteredData.length === 0 ? (
            <div className={`rounded-xl border border-white/12 bg-slate-950/70 px-3 py-8 text-center text-sm text-white/65 ${mobileColumns === 2 ? 'col-span-2' : ''}`}>
              {emptyMessage}
            </div>
          ) : filteredData.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => (onMobileItemClick ?? onDobleClickFila)(item.id)}
              className={`w-full text-left rounded-xl outline-none ring-offset-0 ${selectedId === item.id ? 'ring-2 ring-cyan-400' : ''}`}
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
          loading={loading}
          emptyMessage={emptyMessage}
          rowClassName={rowClassName}
        />
      </div>
    </div>
  );
}
