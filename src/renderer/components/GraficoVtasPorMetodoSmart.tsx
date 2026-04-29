import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { formatCurrencyARS } from "../utils/utils";
import VentasPorMetodoChart from "./GraficoVentasPorMetodoChart";
import { getTotalesPorTipoPago, type MetodoTotal } from "../api/db";

type Props = {
  from?: string;
  to?: string;
  title?: string;
  height?: number;
  innerRadius?: number;
  outerRadius?: number | string;
  showLegend?: boolean;
  cornerRadius?: number;
  className?: string;
};

export default function VentasPorMetodoChartSmart({
  from,
  to,
  title = "Ingresos por método de pago",
  height = 320,
  innerRadius = 60,
  outerRadius = 90,
  showLegend = true,
  cornerRadius = 8,
  className = "",
}: Props) {
  const [totales, setTotales] = useState<MetodoTotal[]>([]);
  const lastErr = useRef<string | null>(null);

  const key = useMemo(() => `${from ?? ""}|${to ?? ""}`, [from, to]);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const rows = await getTotalesPorTipoPago(from, to);
        if (!alive) return;

        setTotales(rows.filter(r => Number.isFinite(r.total) && r.total > 0));
      } catch (e: any) {
        if (!alive) return;

        setTotales([]);
        const msg = e?.message ?? "Error al cargar totales por método";
        if (lastErr.current !== msg) {
          lastErr.current = msg;
          toast.error(msg);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [key]);

  return (
    <VentasPorMetodoChart
      className={className}
      totals={totales}
      title={title}
      height={height}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      showLegend={showLegend}
      cornerRadius={cornerRadius}
      valueFormatter={(n) => formatCurrencyARS(Number(n))}
      onSliceClick={(item) => toast.info(`${item.name}: ${formatCurrencyARS(item.value)}`)}
    />
  );
}

