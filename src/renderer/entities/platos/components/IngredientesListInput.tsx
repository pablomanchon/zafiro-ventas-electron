import { useEffect, useMemo, useState } from 'react';
import { getAll } from '../../../api/crud';
import Steel from '../../../layout/Steel';

interface IngredienteOption {
  id: string;
  nombre: string;
  unidadBase: string;
  cantidadBase: number;
  precioCostoBase: number;
}

interface IngredienteRow {
  ingredienteId: string;
  cantidadUsada: number;
}

const normalizeValue = (value: any): IngredienteRow[] => {
  if (!Array.isArray(value)) return [];
  return value.map((item) => {
    const ingrediente = (item as any)?.ingrediente;
    const ingredienteId =
      (item as any)?.ingredienteId ?? ingrediente?.id ?? (item as any)?.id ?? '';
    const cantidad = Number((item as any)?.cantidadUsada ?? 0);
    return {
      ingredienteId,
      cantidadUsada: isNaN(cantidad) ? 0 : cantidad,
    };
  });
};

const sameRows = (a: IngredienteRow[], b: IngredienteRow[]) =>
  a.length === b.length && a.every((row, idx) =>
    row.ingredienteId === b[idx]?.ingredienteId && Number(row.cantidadUsada) === Number(b[idx]?.cantidadUsada)
  );

export default function IngredientesListInput({
  value,
  onChange,
  disabled,
}: {
  value: IngredienteRow[];
  onChange: (rows: IngredienteRow[]) => void;
  disabled?: boolean;
}) {
  const [ingredientes, setIngredientes] = useState<IngredienteOption[]>([]);
  const [rows, setRows] = useState<IngredienteRow[]>([]);

  useEffect(() => {
    const normalized = normalizeValue(value);
    setRows(prev => sameRows(prev, normalized) ? prev : normalized);
  }, [value]);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAll<IngredienteOption>('ingredientes');
        setIngredientes(data);
      } catch (error) {
        console.error('No se pudieron cargar ingredientes', error);
      }
    })();
  }, []);

  const options = useMemo(() => ingredientes ?? [], [ingredientes]);

  const updateRows = (updater: (prev: IngredienteRow[]) => IngredienteRow[]) => {
    setRows(prev => {
      const next = updater(prev);
      const filtered = next.filter((r) => r.ingredienteId);
      onChange(filtered);
      return next;
    });
  };

  const handleAddRow = () => {
    const defaultId = options[0]?.id ?? '';
    updateRows((prev) => [...prev, { ingredienteId: defaultId, cantidadUsada: 1 }]);
  };

  const handleRowChange = (index: number, patch: Partial<IngredienteRow>) => {
    updateRows((prev) =>
      prev.map((row, idx) => (idx === index ? { ...row, ...patch } : row)),
    );
  };

  const handleRemove = (index: number) => {
    updateRows((prev) => prev.filter((_, idx) => idx !== index));
  };

  return (
    <div className="space-y-3 text-white">
      {rows.length === 0 && (
        <div className="text-sm text-gray-200">Sin ingredientes cargados.</div>
      )}

      <div className="space-y-2">
        {rows.map((row, index) => {
          const unidad = opcionesUnidad(options, row.ingredienteId);
          return (
            <Steel key={`${row.ingredienteId}-${index}`} className="p-3 bg-stone-900/70">
              <div className="grid grid-cols-12 gap-2 items-center">
                <div className="col-span-7 flex flex-col">
                  <label className="text-xs text-gray-200">Ingrediente</label>
                  <select
                    className="mt-1 rounded bg-white/80 text-black px-2 py-1"
                    value={row.ingredienteId}
                    onChange={(e) => handleRowChange(index, { ingredienteId: e.target.value })}
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
                  <label className="text-xs text-gray-200">Cantidad usada</label>
                  <input
                    type="number"
                    step="0.001"
                    min={0}
                    className="mt-1 rounded bg-white/80 text-black px-2 py-1"
                    value={row.cantidadUsada}
                    onChange={(e) => handleRowChange(index, { cantidadUsada: Number(e.target.value) })}
                    disabled={disabled}
                  />
                  {unidad && (
                    <span className="text-[11px] text-gray-300 mt-1">{unidad}</span>
                  )}
                </div>

                <div className="col-span-1 flex justify-center">
                  <button
                    type="button"
                    className="text-red-300 hover:text-red-500"
                    onClick={() => handleRemove(index)}
                    disabled={disabled}
                    aria-label="Quitar ingrediente"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </Steel>
          );
        })}
      </div>

      <button
        type="button"
        className="px-3 py-2 rounded bg-cyan-700 hover:bg-cyan-600 disabled:opacity-60"
        onClick={handleAddRow}
        disabled={disabled || options.length === 0}
      >
        Agregar ingrediente
      </button>
    </div>
  );
}

function opcionesUnidad(options: IngredienteOption[], id: string) {
  const ing = options.find((opt) => opt.id === id);
  if (!ing) return '';
  return `${ing.cantidadBase} ${ing.unidadBase} (costo ${ing.precioCostoBase})`;
}
