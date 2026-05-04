import { useEffect, useMemo, useState, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import Glass from "../layout/Glass";
import Steel from "../layout/Steel";
import LoadingState, { LoadingRows } from "./LoadingState";
import { formatCurrencyARS } from "../utils/utils";
import { getVentasPorVendedor, type VentaVendedor } from "../api/db";

type RangeMode = "day" | "week" | "month" | "custom";

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

function buildRange(anchor: Date, mode: Exclude<RangeMode, "custom">) {
  const a = startOfDay(anchor);

  if (mode === "day") {
    return { from: toYMD(a), to: toYMD(a), label: `Día (${toYMD(a)})` };
  }

  if (mode === "week") {
    const fromDate = startOfWeekMonday(a);
    const toDate = addDays(fromDate, 6);
    return {
      from: toYMD(fromDate),
      to: toYMD(toDate),
      label: `Semana (${toYMD(fromDate)} → ${toYMD(toDate)})`,
    };
  }

  const fromDate = startOfMonth(a);
  const toDate = addDays(addMonths(fromDate, 1), -1);
  return {
    from: toYMD(fromDate),
    to: toYMD(toDate),
    label: `Mes (${toYMD(fromDate)} → ${toYMD(toDate)})`,
  };
}

const COLORS = [
  ["#0a1a3a", "#4da3ff"],
  ["#003d2e", "#00ffb3"],
  ["#3a0a2e", "#ff4ddb"],
  ["#402000", "#ff9f1a"],
  ["#1a003d", "#a84dff"],
  ["#003a3a", "#4dffff"],
  ["#3a2000", "#ffd34d"],
  ["#1a1a00", "#e5ff4d"],
];

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

export default function VentasPorVendedorChart() {
  const [items, setItems] = useState<VentaVendedor[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<RangeMode>("month");
  const [anchor, setAnchor] = useState<Date>(() => new Date());

  const [customFrom, setCustomFrom] = useState<string>(() => toYMD(startOfMonth(new Date())));
  const [customTo, setCustomTo] = useState<string>(() => toYMD(new Date()));

  const { from, to, label } = useMemo(() => {
    if (mode === "custom") {
      return {
        from: customFrom,
        to: customTo,
        label: `Personalizado (${customFrom} → ${customTo})`,
      };
    }
    return buildRange(anchor, mode);
  }, [mode, anchor, customFrom, customTo]);

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
        const data = await getVentasPorVendedor(from, to);
        setItems(data);
      } catch (e: any) {
        setErr(e?.message ?? "Error al cargar ventas por vendedor");
      } finally {
        setLoading(false);
      }
    })();
  }, [from, to]);

  const chartData = useMemo(
    () => [...items].reverse().map((it) => ({ name: it.nombre, total: it.total })),
    [items]
  );

  const totalGeneral = useMemo(() => items.reduce((s, it) => s + it.total, 0), [items]);
  const totalVentas = useMemo(() => items.reduce((s, it) => s + it.cantidad, 0), [items]);

  return (
    <div className="space-y-2 w-full">
      <Steel className="px-3 py-2">
        <Glass className="flex flex-col gap-1.5 p-2 shadow inner shadow-black">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <h2 className="text-base font-semibold">Ventas por vendedor — {label}</h2>

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
              <SegmentButton active={mode === "custom"} onClick={() => setMode("custom")}>
                Personalizado
              </SegmentButton>

              {mode !== "custom" && (
                <>
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
                </>
              )}
            </div>
          </div>

          {mode === "custom" && (
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <label className="text-xs text-white/70">Desde</label>
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="rounded border border-white/20 bg-black/40 px-2 py-0.5 text-sm text-white"
              />
              <label className="text-xs text-white/70">Hasta</label>
              <input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
                className="rounded border border-white/20 bg-black/40 px-2 py-0.5 text-sm text-white"
              />
            </div>
          )}

          <div className="text-xs opacity-80">
            <span className="mr-4">
              Total vendido: <b>{totalVentas} ventas</b>
            </span>
            <span>
              Recaudado: <b>{formatCurrencyARS(totalGeneral)}</b>
            </span>
          </div>
        </Glass>
      </Steel>

      <div className="flex flex-col gap-2 xl:flex-row">
        <Glass className="min-h-[14rem] flex-[1.15] shadow-inner shadow-purple-700 border-purple-700 border">
          {loading ? (
            <LoadingState
              variant="table"
              title="Cargando gráfico"
              message="Calculando ventas por vendedor."
              className="h-full rounded-none border-0"
            />
          ) : err ? (
            <div className="text-sm text-red-500 p-2">{err}</div>
          ) : chartData.length === 0 ? (
            <div className="text-sm opacity-70 p-2">Sin ventas en este rango.</div>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 52)}>
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 6, right: 16, bottom: 4, left: 0 }}
                barSize={22}
              >
                <defs>
                  {chartData.map((_, i) => {
                    const [c1, c2] = COLORS[i % COLORS.length];
                    return (
                      <linearGradient key={i} id={`vendGrad-${i}`} x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor={c1} />
                        <stop offset="100%" stopColor={c2} />
                      </linearGradient>
                    );
                  })}
                </defs>
                <CartesianGrid strokeDasharray="5" opacity={0.2} />
                <XAxis
                  type="number"
                  tick={{ fill: "#fff", fontSize: 11 }}
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={110}
                  tick={{ fill: "#fff", fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    color: "#fff",
                  }}
                  formatter={(v: number) => [formatCurrencyARS(v), "Total"]}
                  labelStyle={{ color: "#94a3b8", fontSize: 11 }}
                />
                <Bar dataKey="total" radius={8}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={`url(#vendGrad-${i})`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Glass>

        <Glass className="relative max-h-[18rem] flex-1 overflow-auto p-0 shadow-inner shadow-purple-700 border-purple-700 border">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-black/70 backdrop-blur-xl">
              <tr>
                <th className="text-left px-3 py-2">Vendedor</th>
                <th className="text-right px-3 py-2">Ventas</th>
                <th className="text-right px-3 py-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <LoadingRows rows={4} columns={3} />
              ) : (
                items.map((it, idx) => (
                  <tr key={idx} className="border-t border-white/10 hover:bg-white/5">
                    <td className="px-3 py-2">{it.nombre}</td>
                    <td className="px-3 py-2 text-right">{it.cantidad}</td>
                    <td className="px-3 py-2 text-right">{formatCurrencyARS(it.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-black sticky bottom-0">
              <tr>
                <td className="px-3 py-2 font-semibold">Totales</td>
                <td className="px-3 py-2 text-right font-semibold">{totalVentas}</td>
                <td className="px-3 py-2 text-right font-semibold">{formatCurrencyARS(totalGeneral)}</td>
              </tr>
            </tfoot>
          </table>
        </Glass>
      </div>
    </div>
  );
}
