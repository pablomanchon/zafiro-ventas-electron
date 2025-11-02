// src/pages/PageHome.tsx
import { useEffect, useMemo, useState } from "react";
import Steel from "../layout/Steel";
import { formatCurrencyARS, todayYMD } from "../utils/utils";
import { getSelledProductsByDate } from "../api/db";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import Main from "../layout/Main";
import Glass from "../layout/Glass";
import VentasPorMetodoChartSmart from "../components/GraficoVtasPorMetodoSmart";

type Vendido = {
  periodo: string;
  nombre: string;
  cantidad: number;
  importe: number;
};

export default function PageHome() {
  const [items, setItems] = useState<Vendido[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // rango "hoy" usando utils.ts
  const { from, to } = useMemo(() => {
    const today = todayYMD();
    return { from: today, to: today };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getSelledProductsByDate("day", from, to);
        data.sort((a: Vendido, b: Vendido) => (b.cantidad || 0) - (a.cantidad || 0));
        setItems(data);
      } catch (e: any) {
        console.error(e);
        setErr(e?.message ?? "Error al cargar vendidos de hoy");
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to]);

  // ---- Data para gráfico (Top 10 por cantidad) ----
  const chartData = useMemo(
    () =>
      items
        .map((it) => ({ name: it.nombre, cantidad: it.cantidad }))
        .slice(0, 10)
        // opcional: invertir para que el mayor quede arriba
        .reverse(),
    [items]
  );

  const totalCant = useMemo(
    () => items.reduce((s, it) => s + (it.cantidad || 0), 0),
    [items]
  );
  const totalImp = useMemo(
    () => items.reduce((s, it) => s + (it.importe || 0), 0),
    [items]
  );

  return (
    <Main className="flex flex-col items-center">
      <Steel>
        <div className="p-2 space-y-3">
          <Glass className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Vendidos hoy ({from})</h2>
            <div className="text-sm opacity-80">
              <span className="mr-4">Total items: <b>{totalCant}</b></span>
              <span>Recaudado: <b>{formatCurrencyARS(totalImp)}</b></span>
            </div>
          </Glass>

          {/* ------- Gráfico ------- */}
          <Glass className="h-96 shadow shadow-black">
            {loading ? (
              <div className="text-sm opacity-70 p-2">Cargando gráfico…</div>
            ) : err ? (
              <div className="text-sm text-red-500 p-2">{err}</div>
            ) : chartData.length === 0 ? (
              <div className="text-sm opacity-70 p-2">Sin ventas hoy.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 8, right: 16, bottom: 8, left: 5 }}
                >
                  <CartesianGrid strokeDasharray="5" opacity={0.2} />
                  <XAxis type="number" tick={{ fill: "#fff" }} allowDecimals={false} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={160}
                    tick={{ fill: "#fff", fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(v: number) => [v, "Cantidad"]}
                    labelClassName="text-sm"
                  />
                  <Bar dataKey="cantidad" radius={8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Glass>

          {/* ------- Tabla ------- */}
          <Glass className="overflow-auto max-h-[60vh] shadow-black shadow">
            <table className="w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-3 py-2">Producto</th>
                  <th className="text-right px-3 py-2">Cantidad</th>
                  <th className="text-right px-3 py-2">Importe</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it, idx) => (
                  <tr key={idx} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-3 py-2">{it.nombre}</td>
                    <td className="px-3 py-2 text-right">{it.cantidad}</td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrencyARS(it.importe)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5 border-t border-white/10">
                <tr>
                  <td className="px-3 py-2 font-semibold">Totales</td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {totalCant}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold">
                    {formatCurrencyARS(totalImp)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </Glass>
        </div>
      </Steel>
      <Steel>
        <VentasPorMetodoChartSmart from={todayYMD()} to={todayYMD()} />
      </Steel>
    </Main>
  );
}
