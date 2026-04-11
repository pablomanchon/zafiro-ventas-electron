import { useEffect, useMemo } from "react";
import Wood from "../../layout/Steel";
import Title from "../../layout/Title";
import { useHorarios } from "./useHorarios";

export default function HorarioVendedor({ id }: { id: number }) {
  const {
    horarios,
    fetchAll,
    filterByVendedor,
    getHorasDia,
    getHorasSemana,
    getHorasMes,
  } = useHorarios();

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const lista = useMemo(() => {
    return filterByVendedor(id);
  }, [filterByVendedor, id]);

  return (
    <Wood className="text-white">
      <div className="flex items-center justify-between gap-2">
        <Title>Vendedor #{id}</Title>
      </div>

      <div className="mt-2 space-y-1">
        <p>Horas hoy: {getHorasDia(new Date(), id)}</p>
        <p>Horas esta semana: {getHorasSemana(new Date(), id)}</p>
        <p>Horas este mes: {getHorasMes(new Date(), id)}</p>
        <p className="text-sm opacity-70">
          Total turnos: {lista.length} (global: {horarios.length})
        </p>
      </div>

      <div className="mt-4 max-h-96 overflow-y-auto rounded-md border border-white/10">
        {lista.length === 0 ? (
          <div className="p-3 opacity-70">No hay horarios para este vendedor.</div>
        ) : (
          lista.map((h) => (
            <div
              key={h.id}
              className="border-b border-white/10 p-3 last:border-b-0"
            >
              <p className="text-sm opacity-80">ID: {h.id}</p>
              <p>Ingreso: {new Date(h.horaIngreso).toLocaleString()}</p>
              <p>
                Egreso:{" "}
                {h.horaEgreso
                  ? new Date(h.horaEgreso).toLocaleString()
                  : "---"}
              </p>
            </div>
          ))
        )}
      </div>
    </Wood>
  );
}