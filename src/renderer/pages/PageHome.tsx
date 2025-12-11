// src/pages/PageHome.tsx
import { useEffect, useMemo, useState } from "react";
import Steel from "../layout/Steel";
import { formatCurrencyARS, monthAgo, todayYMD } from "../utils/utils";
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
    const mAgo = monthAgo(new Date());
    const today = todayYMD()
    return { from: mAgo, to: today };
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const data = await getSelledProductsByDate(from, to);
        data.sort((a: Vendido, b: Vendido) => (b.cantidad || 0) - (a.cantidad || 0));
        setItems(data);
      } catch (e: any) {
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
      <div className="p-2 space-y-3">
        <Steel>
          <Glass className="flex items-center justify-between shadow inner shadow-black">
            <h2 className="text-lg font-semibold">Vendidos hoy ({from})</h2>
            <div className="text-sm opacity-80">
              <span className="mr-4">Total items: <b>{totalCant}</b></span>
              <span>Recaudado: <b>{formatCurrencyARS(totalImp)}</b></span>
            </div>
          </Glass>
        </Steel>

        {/* ------- Gráfico ------- */}

        <Glass className="h-96 shadow-inner shadow-cyan-700 border-cyan-700 border">
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
                barSize={25}
              >
                <defs>
                  <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#002" />
                    <stop offset="100%" stopColor="#016" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="5" opacity={0.2} />
                <XAxis type="number" tick={{ fill: "#fff" }} allowDecimals={false} />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={160}
                  tick={{ fill: "#fff", fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "8px",
                    border: "1px solid rgba(0,0,0,0.2)",
                    color: "#000",
                  }}
                  formatter={(v: number) => [v, "Cantidad"]}
                  labelClassName="text-sm"
                />
                <Bar dataKey="cantidad" radius={8} fill="url(#barGradient)" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </Glass>

        {/* ------- Tabla ------- */}
        <Glass className="overflow-auto max-h-[60vh] relative p-0 shadow-inner shadow-cyan-700 border-cyan-700 border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black/60 backdrop-blur-xl">
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
            <tfoot className="bg-black sticky bottom-0">
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
      <VentasPorMetodoChartSmart className="shadow-white border border-white" from={monthAgo(new Date())} to={todayYMD()} />
    </Main>
  );
}
