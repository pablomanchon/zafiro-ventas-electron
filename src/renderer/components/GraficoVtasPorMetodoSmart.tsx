// src/components/VentasPorMetodoChartSmart.tsx
import { useEffect } from "react";
import { toast } from "react-toastify";
import { formatCurrencyARS } from "../utils/utils";
import useSales from "../hooks/useSales";
import VentasPorMetodoChart from "./GraficoVentasPorMetodoChart";

type Props = {
  from?: string;   // 'YYYY-MM-DD'
  to?: string;     // 'YYYY-MM-DD'
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
  outerRadius = "90%",
  showLegend = true,
  cornerRadius = 8,
  className = "",
}: Props) {
  // usamos TU hook
  const { setFilter, totales = [], error } = useSales();

  // cuando cambian from/to, actualizamos el filtro del hook
  useEffect(() => {
    // mantenemos el resto del filtro que ya tuviera el hook (cliente, etc.)
    setFilter((prev: any) => ({
      ...prev,
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    }));
  }, [from, to, setFilter]);

  if (error) {
    toast.error(error);
  }

  // callback de click en porción
  const handleSliceClick = (item: { name: string; value: number }) => {
    toast.info(`${item.name}: ${formatCurrencyARS(item.value)}`);
  };

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
      onSliceClick={handleSliceClick}
    />
  );
}
