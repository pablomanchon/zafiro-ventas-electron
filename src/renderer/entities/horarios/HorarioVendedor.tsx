// src/pages/horarios/HorarioVendedor.tsx
import { useEffect, useMemo } from "react";
import PrimaryButton from "../../components/PrimaryButton";
import Wood from "../../layout/Steel";
import Title from "../../layout/Title";
import { useHorarios } from "./useHorarios";

export default function HorarioVendedor({ id }: { id: number }) {
  const {
    horarios,
    loading,
    fetchAll,
    filterByVendedor,
    getHorasDia,
    getHorasSemana,
    getHorasMes,
    marcarIngreso,
    marcarEgreso,
  } = useHorarios();

  // ✅ traer horarios al montar (y cuando cambia el vendedor si querés)
  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ✅ lista filtrada memoizada para no recalcular en cada render
  const lista = useMemo(() => filterByVendedor(id), [filterByVendedor, id]);

  const now = new Date();

  const horasHoy = useMemo(() => getHorasDia(now, id), [getHorasDia, id, now]);
  const horasSemana = useMemo(() => getHorasSemana(now, id), [getHorasSemana, id, now]);
  const horasMes = useMemo(() => getHorasMes(now, id), [getHorasMes, id, now]);

  // ✅ si querés: detectar si tiene un turno "abierto" (sin egreso)
  const turnoAbierto = useMemo(
    () => lista.find((h) => !h.horaEgreso),
    [lista]
  );

  return (
    <Wood className="text-white">
      <div className="flex items-center justify-between gap-2">
        <Title>Vendedor #{id}</Title>

        <div className="flex gap-2">
          <PrimaryButton
            title={loading ? "Cargando..." : "Actualizar"}
            disabled={loading}
            functionClick={() => fetchAll()}
          />
        </div>
      </div>

      <div className="mt-2 space-y-1">
        <p>Horas hoy: {horasHoy}</p>
        <p>Horas esta semana: {horasSemana}</p>
        <p>Horas este mes: {horasMes}</p>
        <p className="opacity-70 text-sm">Total turnos: {lista.length} (global: {horarios.length})</p>
      </div>

      <div className="mt-4 max-h-96 overflow-y-auto border border-white/10 rounded-md">
        {lista.length === 0 ? (
          <div className="p-3 opacity-70">No hay horarios para este vendedor.</div>
        ) : (
          lista.map((h) => (
            <div key={h.id} className="p-3 border-b border-white/10 last:border-b-0">
              <p className="text-sm opacity-80">ID: {h.id}</p>
              <p>Ingreso: {new Date(h.horaIngreso).toLocaleString()}</p>
              <p>
                Egreso:{" "}
                {h.horaEgreso ? new Date(h.horaEgreso).toLocaleString() : "---"}
              </p>

              {!h.horaEgreso && (
                <div className="mt-2">
                  <PrimaryButton
                    title={loading ? "..." : "Marcar egreso"}
                    disabled={loading}
                    functionClick={() => marcarEgreso(h.vendedor!.id)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <PrimaryButton
          title={loading ? "..." : "Marcar ingreso"}
          disabled={loading}
          functionClick={() => marcarIngreso({ vendedorId: id })}
        />

        {/* opcional: marcar egreso directo del último abierto */}
        <PrimaryButton
          title={loading ? "..." : "Marcar egreso (último abierto)"}
          disabled={loading || !turnoAbierto}
          functionClick={() => {
            if (!turnoAbierto) return;
            return marcarEgreso(turnoAbierto.vendedor!.id);
          }}
        />
      </div>
    </Wood>
  );
}
