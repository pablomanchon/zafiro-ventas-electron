import { useMemo } from "react";
import Pie2DChart, { type PieDatum } from "./Grafico";

export type MetodoTotal = { tipo: string; total: number };

type Props = {
  /** Totales por método (lo que te devuelve totalsByMetodoPago/totalesByTipoPago) */
  totals?: MetodoTotal[];
  title?: string;
  height?: number;
  innerRadius?: number;   // 0 = torta sólida
  outerRadius?: number | string;
  showLegend?: boolean;
  cornerRadius?: number;
  /** Formateador de valores (ej: formatCurrencyARS) */
  valueFormatter?: (n: number | string) => string;
  /** Click en porción */
  onSliceClick?: (item: { name: string; value: number }) => void;
  /** Clase extra para el Steel contenedor (opcional) */
  className?: string;
};

export default function VentasPorMetodoChart({
  totals = [],
  title = "Ingresos por método de pago",
  height = 320,
  innerRadius = 60,
  outerRadius = "90%",
  showLegend = true,
  cornerRadius = 8,
  valueFormatter,
  onSliceClick,
  className = "",
}: Props) {
  const data: PieDatum[] = useMemo(
    () =>
      (totals ?? [])
        .filter(t => Number.isFinite(t.total) && t.total > 0)
        .map(t => ({ name: t.tipo, value: t.total })),

    [totals]
  );  

  return (
    <div className={`w-full shadow-inner shadow-black rounded ${className}`}>
      <Pie2DChart
        title={title}
        data={data}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        showLegend={showLegend}
        cornerRadius={cornerRadius}
        height={height}
        valueFormatter={valueFormatter}
        onSliceClick={onSliceClick}
      />
    </div>
  );
}
