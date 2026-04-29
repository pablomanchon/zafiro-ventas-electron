import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import Title from "../layout/Title";
import Glass from "../layout/Glass";
import { formatCurrencyARS } from "../utils/utils";

// ────────────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────────────
export type PieDatum = {
    name: string;
    value: number;
    color?: string;
};

export type Pie2DChartProps = {
    title?: string;
    data: PieDatum[];
    innerRadius?: number | string;
    outerRadius?: number | string;
    showLegend?: boolean;
    valueFormatter?: (n: number) => string;
    onSliceClick?: (item: PieDatum, index: number) => void;
    height?: number;
    showLabels?: boolean;
    cornerRadius?: number;
    /** 🔹 activa labels con efecto glass */
    showGlassLabels?: boolean;
};

const DEFAULT_COLORS = [
    "#6366F1",
    "#22C55E",
    "#F59E0B",
    "#EF4444",
    "#06B6D4",
    "#A855F7",
    "#84CC16",
    "#EAB308",
    "#14B8A6",
    "#3B82F6",
];

// ────────────────────────────────────────────────────────────────────────────────
// Component
// ────────────────────────────────────────────────────────────────────────────────
export default function Pie2DChart({
    title,
    data,
    innerRadius = "40%",
    outerRadius = 90,
    showLegend = true,
    valueFormatter = (n) => new Intl.NumberFormat().format(n),
    onSliceClick,
    height = 320,
    showLabels = true,
    cornerRadius = 4,
    showGlassLabels = false, // 🔹 default off
}: Pie2DChartProps) {
    const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

    const label = (props: any) => {
        const {
            cx,
            cy,
            midAngle,
            innerRadius: ir,
            outerRadius: or,
            percent,
        } = props;

        if (!showLabels || percent < 0.06) return null;

        const RADIAN = Math.PI / 180;
        const radius = ir + (or - ir) * 0.5;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="#fff"
                textAnchor="middle"
                dominantBaseline="central"
                style={{ fontSize: 12, fontWeight: 700 }}
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    if (!safeData.length) {
        return (
            <Glass className="p-10">
                <Title>No hay datos para mostrar.</Title>
            </Glass>
        );
    }

    return (
        <div role="figure" aria-label={title ?? "Gráfico de torta"} className="w-full">
            <Glass>
                {title && <Title>{title}</Title>}

                <div className="w-full flex" style={{ height }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={safeData}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                isAnimationActive={true}
                                labelLine={false}
                                label={label}
                                cornerRadius={cornerRadius}
                                paddingAngle={3}
                                onClick={(_, idx) => onSliceClick?.(safeData[idx], idx)} // ✔ firma correcta
                            >
                                {safeData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value) => [
                                    formatCurrencyARS(Number(value ?? 0)),
                                    "Importe",
                                ]}
                            />


                            {showLegend && (
                                <Legend
                                    verticalAlign="bottom"
                                    wrapperStyle={{ paddingTop: 8 }}
                                    formatter={(value: string, entry: any) => (
                                        <span>
                                            {value} — {valueFormatter(Number(entry?.payload?.value))}
                                        </span>
                                    )}
                                />
                            )}
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </Glass>
        </div>
    );
}
