import { useMemo } from "react";
import {
    PieChart,
    Pie,
    Cell,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import Title from "../layout/Title";
import Glass from "../layout/Glass";

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
}: Pie2DChartProps) {
    const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);
    const total = useMemo(
        () => safeData.reduce((sum, item) => sum + Number(item.value || 0), 0),
        [safeData]
    );
    const chartHeight = showLegend ? Math.max(150, Math.min(210, height - 90)) : height;
    const legendMaxHeight = showLegend ? Math.max(78, height - chartHeight) : 0;

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
        <div role="figure" aria-label={title ?? "Grafico de torta"} className="w-full">
            <Glass>
                {title && <Title>{title}</Title>}

                <div className="w-full flex" style={{ height: chartHeight }}>
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
                                onClick={(_, idx) => onSliceClick?.(safeData[idx], idx)}
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
                                    valueFormatter(Number(value ?? 0)),
                                    "Importe",
                                ]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {showLegend && (
                    <div
                        className="mt-2 overflow-y-auto pr-1 text-sm leading-tight"
                        style={{ maxHeight: legendMaxHeight }}
                    >
                        <div className="grid grid-cols-1 gap-1.5">
                            {safeData.map((item, index) => {
                                const color = item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                                const percent = total > 0 ? (item.value / total) * 100 : 0;

                                return (
                                    <div
                                        key={`${item.name}-${index}`}
                                        className="grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto_auto] items-center gap-1.5 text-white/90"
                                        title={`${item.name}: ${valueFormatter(item.value)}`}
                                    >
                                        <span
                                            className="h-2.5 w-2.5 shrink-0 rounded-sm"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="truncate font-medium" style={{ color }}>
                                            {item.name}
                                        </span>
                                        <span className="shrink-0 tabular-nums" style={{ color }}>
                                            {valueFormatter(item.value)}
                                        </span>
                                        <span className="shrink-0 text-xs text-white/45">
                                            ({percent.toFixed(0)}%)
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Glass>
        </div>
    );
}
