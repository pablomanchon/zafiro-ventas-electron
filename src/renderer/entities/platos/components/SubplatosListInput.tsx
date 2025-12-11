import { useEffect, useMemo, useState } from 'react';
import { getAll } from '../../../api/crud';
import Steel from '../../../layout/Steel';

interface PlatoOption {
  id: string;
  nombre: string;
}

interface SubplatoRow {
  platoHijoId: string;
  cantidadUsada: number;
}

const normalizeValue = (value: any): SubplatoRow[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const plato = (item as any)?.platoHijo;
    const platoHijoId = (item as any)?.platoHijoId ?? plato?.id ?? (item as any)?.id ?? '';
    const cantidad = Number((item as any)?.cantidadUsada ?? 0);
    return {
      platoHijoId,
      cantidadUsada: isNaN(cantidad) ? 0 : cantidad,
    };
  });
};

const sameRows = (a: SubplatoRow[], b: SubplatoRow[]) =>
  a.length === b.length && a.every((row, idx) =>
    row.platoHijoId === b[idx]?.platoHijoId && Number(row.cantidadUsada) === Number(b[idx]?.cantidadUsada)
  );

export default function SubplatosListInput({
  value,
  onChange,
  disabled,
}: {
  value: SubplatoRow[];
  onChange: (rows: SubplatoRow[]) => void;
  disabled?: boolean;
}) {
  const [platos, setPlatos] = useState<PlatoOption[]>([]);
  const [rows, setRows] = useState<SubplatoRow[]>([]);

  useEffect(() => {
    const normalized = normalizeValue(value);
    setRows(prev => sameRows(prev, normalized) ? prev : normalized);
  }, [value]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAll<PlatoOption>('platos');
        setPlatos(data);
      } catch (error) {
        console.error('No se pudieron cargar los platos', error);
      }
    })();
  }, []);

  const options = useMemo(() => platos ?? [], [platos]);

  const updateRows = (updater: (prev: SubplatoRow[]) => SubplatoRow[]) => {
    setRows(prev => {
      const next = updater(prev);
      const filtered = next.filter((r) => r.platoHijoId);
      onChange(filtered);
      return next;
    });
  };

  const handleAddRow = () => {
    const defaultId = options[0]?.id ?? '';
    updateRows((prev) => [...prev, { platoHijoId: defaultId, cantidadUsada: 1 }]);
  };

  const handleRowChange = (index: number, patch: Partial<SubplatoRow>) => {
    updateRows((prev) => prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)));
  };

  const handleRemove = (index: number) => {
    updateRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-3 text-white">
      {rows.length === 0 && (
        <div className="text-sm text-gray-200">Sin subplatos agregados.</div>
      )}

      <div className="space-y-2">
        {rows.map((row, index) => (
          <Steel key={`${row.platoHijoId}-${index}`} className="p-3 bg-stone-900/70">
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-7 flex flex-col">
                <label className="text-xs text-gray-200">Subplato</label>
                <select
                  className="mt-1 rounded bg-white/80 text-black px-2 py-1"
                  value={row.platoHijoId}
                  onChange={(e) => handleRowChange(index, { platoHijoId: e.target.value })}
                  disabled={disabled}
                >
                  {options.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-4 flex flex-col">
                <label className="text-xs text-gray-200">Cantidad</label>
                <input
                  type="number"
                  step="0.001"
                  min={0}
                  className="mt-1 rounded bg-white/80 text-black px-2 py-1"
                  value={row.cantidadUsada}
                  onChange={(e) => handleRowChange(index, { cantidadUsada: Number(e.target.value) })}
                  disabled={disabled}
                />
              </div>

              <div className="col-span-1 flex justify-center">
                <button
                  type="button"
                  className="text-red-300 hover:text-red-500"
                  onClick={() => handleRemove(index)}
                  disabled={disabled}
                  aria-label="Quitar subplato"
                >
                  ✕
                </button>
              </div>
            </div>
          </Steel>
        ))}
      </div>

      <button
        type="button"
        className="px-3 py-2 rounded bg-cyan-700 hover:bg-cyan-600 disabled:opacity-60"
        onClick={handleAddRow}
        disabled={disabled || options.length === 0}
      >
        Agregar subplato
      </button>

      <p className="text-xs text-gray-200">
        Los subplatos permiten reutilizar recetas ya cargadas. Evitá ciclos (el backend los bloqueará).
      </p>
    </div>
  );
}
