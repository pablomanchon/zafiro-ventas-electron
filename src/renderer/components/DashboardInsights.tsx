import { useEffect, useMemo, useState, useCallback } from "react";
import Steel from "../layout/Steel";
import { formatCurrencyARS } from "../utils/utils";
import { getSelledProductsByDate, getVentasPorDia, type VentaDia } from "../api/db";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import Glass from "../layout/Glass";
import VentasPorMetodoChartSmart from "./GraficoVtasPorMetodoSmart";
import LoadingState, { LoadingRows } from "./LoadingState";

type Vendido = {
  periodo: string;
  nombre: string;
  cantidad: number;
  importe: number;
};

type RangeMode = "day" | "week" | "month";

function toYMD(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function startOfWeekMonday(d: Date) {
  const x = startOfDay(d);
  const jsDay = x.getDay();
  const diff = jsDay === 0 ? -6 : 1 - jsDay;
  x.setDate(x.getDate() + diff);
  return x;
}

function startOfMonth(d: Date) {
  const x = startOfDay(d);
  x.setDate(1);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function addMonths(d: Date, months: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + months);
  return x;
}

function buildRange(anchor: Date, mode: RangeMode) {
  const a = startOfDay(anchor);

  if (mode === "day") {
    const from = a;
    const to = a;
    return { from: toYMD(from), to: toYMD(to), label: `Día (${toYMD(from)})` };
  }

  if (mode === "week") {
    const fromDate = startOfWeekMonday(a);
    const toDate = addDays(fromDate, 6);
    return {
      from: toYMD(fromDate),
      to: toYMD(toDate),
      label: `Semana (${toYMD(fromDate)} -> ${toYMD(toDate)})`,
    };
  }

  const fromDate = startOfMonth(a);
  const toDate = addDays(addMonths(fromDate, 1), -1);
  return {
    from: toYMD(fromDate),
    to: toYMD(toDate),
    label: `Mes (${toYMD(fromDate)} -> ${toYMD(toDate)})`,
  };
}

function getGradientByCantidad(cantidad: number) {
  if (cantidad < 10) return ["#3a0a0a", "#ff3b3b"];
  if (cantidad < 30) return ["#402000", "#ff9f1a"];
  if (cantidad < 60) return ["#003d2e", "#00ffb3"];
  return ["#0a1a3a", "#4da3ff"];
}

function SegmentButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={[
        "px-2.5 py-0.5 rounded border text-sm transition",
        active
          ? "bg-white/20 border-white/40 text-white"
          : "bg-black/20 border-white/15 text-white/80 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function DashboardInsights() {
  const [items, setItems] = useState<Vendido[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [evolutionData, setEvolutionData] = useState<VentaDia[]>([]);
  const [mode, setMode] = useState<RangeMode>("day");
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  const { from, to, label } = useMemo(() => buildRange(anchor, mode), [anchor, mode]);

  const shift = useCallback(
    (dir: -1 | 1) => {
      setAnchor((prev) => {
        if (mode === "day") return addDays(prev, dir);
        if (mode === "week") return addDays(prev, dir * 7);
        return addMonths(prev, dir);
      });
    },
    [mode]
  );

  const goToday = useCallback(() => setAnchor(new Date()), []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const [data, dias] = await Promise.all([
          getSelledProductsByDate(from, to),
          getVentasPorDia(from, to),
        ]);
        data.sort((a: Vendido, b: Vendido) => (b.cantidad || 0) - (a.cantidad || 0));
        setItems(data);
        setEvolutionData(dias.map((d) => ({ ...d, fecha: d.fecha.slice(5) })));
      } catch (e: any) {
        setErr(e?.message ?? "Error al cargar vendidos");
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to]);

  const chartData = useMemo(
    () =>
      items
        .map((it) => ({ name: it.nombre, cantidad: it.cantidad }))
        .slice(0, 10)
        .reverse(),
    [items]
  );

  const totalCant = useMemo(() => items.reduce((s, it) => s + (it.cantidad || 0), 0), [items]);
  const totalImp = useMemo(() => items.reduce((s, it) => s + (it.importe || 0), 0), [items]);

  return (
    <div className="space-y-2 w-full">
      <Steel className="px-3 py-2">
        <Glass className="flex flex-col gap-1.5 p-2 shadow inner shadow-black">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-semibold">Vendidos - {label}</h2>

            <div className="flex items-center gap-1.5 flex-wrap">
              <SegmentButton active={mode === "day"} onClick={() => setMode("day")}>
                Día
              </SegmentButton>
              <SegmentButton active={mode === "week"} onClick={() => setMode("week")}>
                Semana
              </SegmentButton>
              <SegmentButton active={mode === "month"} onClick={() => setMode("month")}>
                Mes
              </SegmentButton>

              <div className="w-px h-5 bg-white/20 mx-1 hidden sm:block" />

              <button
                className="px-2 py-0.5 rounded border border-white/15 bg-black/20 hover:bg-white/10"
                onClick={() => shift(-1)}
                title="Anterior"
              >
                {"<"}
              </button>
              <button
                className="px-2.5 py-0.5 rounded border border-white/15 bg-black/20 hover:bg-white/10"
                onClick={goToday}
                title="Ir a hoy"
              >
                Hoy
              </button>
              <button
                className="px-2 py-0.5 rounded border border-white/15 bg-black/20 hover:bg-white/10"
                onClick={() => shift(1)}
                title="Siguiente"
              >
                {">"}
              </button>
            </div>
          </div>

          <div className="text-xs opacity-80">
            <span className="mr-4">
              Total items: <b>{totalCant}</b>
            </span>
            <span>
              Recaudado: <b>{formatCurrencyARS(totalImp)}</b>
            </span>
            <span className="ml-4 opacity-70">
              Rango: <b>{from}</b> {"->"} <b>{to}</b>
            </span>
          </div>
        </Glass>
      </Steel>

      <div className="flex flex-col gap-2 xl:flex-row">
      <Glass className="min-h-[15rem] flex-[1.15] shadow-inner shadow-cyan-700 border-cyan-700 border">
        {loading ? (
          <LoadingState
            variant="table"
            title="Cargando gráfico"
            message="Calculando los productos más vendidos."
            className="h-full rounded-none border-0"
          />
        ) : err ? (
          <div className="text-sm text-red-500 p-2">{err}</div>
        ) : chartData.length === 0 ? (
          <div className="text-sm opacity-70 p-2">Sin ventas en este rango.</div>
        ) : (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 6, right: 12, bottom: 4, left: 0 }}
              barSize={18}
            >
              <defs>
                {chartData.map((d, i) => {
                  const [c1, c2] = getGradientByCantidad(d.cantidad);
                  return (
                    <linearGradient key={i} id={`barGradient-${i}`} x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor={c1} />
                      <stop offset="100%" stopColor={c2} />
                    </linearGradient>
                  );
                })}
              </defs>

              <CartesianGrid strokeDasharray="5" opacity={0.2} />
              <XAxis type="number" tick={{ fill: "#fff" }} allowDecimals={false} />
              <YAxis dataKey="name" type="category" width={115} tick={{ fill: "#fff", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  borderRadius: "8px",
                  border: "1px solid rgba(0,0,0,0.2)",
                  color: "#000",
                }}
                formatter={(v: number | undefined) => [v ?? 0, "Cantidad"]}
                labelClassName="text-sm"
              />

              <Bar dataKey="cantidad" radius={8}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`url(#barGradient-${i})`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </Glass>

      <Glass className="relative max-h-[16rem] flex-1 overflow-auto p-0 shadow-inner shadow-cyan-700 border-cyan-700 border">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-black/70 backdrop-blur-xl">
            <tr>
              <th className="text-left px-3 py-2">Producto</th>
              <th className="text-right px-3 py-2">Cantidad</th>
              <th className="text-right px-3 py-2">Importe</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <LoadingRows rows={5} columns={3} />
            ) : items.map((it, idx) => (
              <tr key={idx} className="border-t border-white/10 hover:bg-white/5">
                <td className="px-3 py-2">{it.nombre}</td>
                <td className="px-3 py-2 text-right">{it.cantidad}</td>
                <td className="px-3 py-2 text-right">{formatCurrencyARS(it.importe)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-black sticky bottom-0">
            <tr>
              <td className="px-3 py-2 font-semibold">Totales</td>
              <td className="px-3 py-2 text-right font-semibold">{totalCant}</td>
              <td className="px-3 py-2 text-right font-semibold">{formatCurrencyARS(totalImp)}</td>
            </tr>
          </tfoot>
        </table>
      </Glass>
      </div>

      <div className="flex flex-col gap-2 xl:flex-row xl:items-stretch">
        <VentasPorMetodoChartSmart
          className="shadow-white border border-white xl:w-80 shrink-0"
          from={from}
          to={to}
          height={300}
          innerRadius={52}
          outerRadius={95}
        />

        {evolutionData.length > 1 && (
          <Glass className="flex-1 p-3 shadow-inner shadow-cyan-700 border-cyan-700 border flex flex-col gap-2 min-w-0">
            <p className="text-sm font-semibold">Evolución de ingresos</p>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={evolutionData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#06B6D4" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4" opacity={0.12} />
                <XAxis dataKey="fecha" tick={{ fill: "#94a3b8", fontSize: 10 }} interval="preserveStartEnd" />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} width={58} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1e293b", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, color: "#fff" }}
                  formatter={(v: number) => [formatCurrencyARS(v), "Ingresos"]}
                  labelStyle={{ color: "#94a3b8", fontSize: 11 }}
                />
                <Area dataKey="total" stroke="#06B6D4" strokeWidth={2} fill="url(#areaGradient)" dot={{ r: 3, fill: "#06B6D4", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </Glass>
        )}
      </div>
    </div>
  );
}
