// src/pages/PageHome.tsx
import { useEffect, useMemo, useState, useCallback } from "react";
import Steel from "../layout/Steel";
import { formatCurrencyARS } from "../utils/utils";
import { getSelledProductsByDate } from "../api/db";
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
import Main from "../layout/Main";
import Glass from "../layout/Glass";
import VentasPorMetodoChartSmart from "../components/GraficoVtasPorMetodoSmart";

type Vendido = {
  periodo: string;
  nombre: string;
  cantidad: number;
  importe: number;
};

type RangeMode = "day" | "week" | "month";

function toYMD(d: Date) {
  // YYYY-MM-DD
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
  // JS: 0=Dom,1=Lun,...6=Sab
  const jsDay = x.getDay();
  const diff = jsDay === 0 ? -6 : 1 - jsDay; // domingo -> lunes anterior
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
    const to = a; // mismo día
    return { from: toYMD(from), to: toYMD(to), label: `Día (${toYMD(from)})` };
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

  // month
  const fromDate = startOfMonth(a);
  const toDate = addDays(addMonths(fromDate, 1), -1); // último día del mes
  return {
    from: toYMD(fromDate),
    to: toYMD(toDate),
    label: `Mes (${toYMD(fromDate)} → ${toYMD(toDate)})`,
  };
}

export default function PageHome() {
  const [items, setItems] = useState<Vendido[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [mode, setMode] = useState<RangeMode>("day");
  const [anchor, setAnchor] = useState<Date>(() => new Date()); // fecha “base” para el periodo

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
        const data = await getSelledProductsByDate(from, to);
        data.sort((a: Vendido, b: Vendido) => (b.cantidad || 0) - (a.cantidad || 0));
        console.log(data);
        setItems(data);
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

  function getGradientByCantidad(cantidad: number) {
    if (cantidad < 10) return ["#3a0a0a", "#ff3b3b"];
    if (cantidad < 30) return ["#402000", "#ff9f1a"];
    if (cantidad < 60) return ["#003d2e", "#00ffb3"];
    return ["#0a1a3a", "#4da3ff"];
  }

  const SegmentButton = ({
    active,
    children,
    onClick,
  }: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={[
        "px-3 py-1 rounded border text-sm transition",
        active
          ? "bg-white/20 border-white/40 text-white"
          : "bg-black/20 border-white/15 text-white/80 hover:bg-white/10",
      ].join(" ")}
    >
      {children}
    </button>
  );

  return (
    <Main className="flex flex-col items-center">
      <div className="p-2 space-y-3 w-full">
        <Steel>
          <Glass className="flex flex-col gap-2 shadow inner shadow-black">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h2 className="text-lg font-semibold">Vendidos — {label}</h2>

              <div className="flex items-center gap-2">
                <SegmentButton active={mode === "day"} onClick={() => setMode("day")}>
                  Día
                </SegmentButton>
                <SegmentButton active={mode === "week"} onClick={() => setMode("week")}>
                  Semana
                </SegmentButton>
                <SegmentButton active={mode === "month"} onClick={() => setMode("month")}>
                  Mes
                </SegmentButton>

                <div className="w-px h-6 bg-white/20 mx-1" />

                <button
                  className="px-2 py-1 rounded border border-white/15 bg-black/20 hover:bg-white/10"
                  onClick={() => shift(-1)}
                  title="Anterior"
                >
                  ◀
                </button>
                <button
                  className="px-3 py-1 rounded border border-white/15 bg-black/20 hover:bg-white/10"
                  onClick={goToday}
                  title="Ir a hoy"
                >
                  Hoy
                </button>
                <button
                  className="px-2 py-1 rounded border border-white/15 bg-black/20 hover:bg-white/10"
                  onClick={() => shift(1)}
                  title="Siguiente"
                >
                  ▶
                </button>
              </div>
            </div>

            <div className="text-sm opacity-80">
              <span className="mr-4">
                Total items: <b>{totalCant}</b>
              </span>
              <span>
                Recaudado: <b>{formatCurrencyARS(totalImp)}</b>
              </span>
              <span className="ml-4 opacity-70">
                Rango: <b>{from}</b> → <b>{to}</b>
              </span>
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
            <div className="text-sm opacity-70 p-2">Sin ventas en este rango.</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 8, right: 16, bottom: 8, left: 5 }}
                barSize={25}
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
                <YAxis dataKey="name" type="category" width={160} tick={{ fill: "#fff", fontSize: 12 }} />
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

        {/* ✅ usa el MISMO rango para que coincida con lo de arriba */}
        <VentasPorMetodoChartSmart
          className="shadow-white border border-white"
          from={from}
          to={to}
        />
      </div>
    </Main>
  );
}
