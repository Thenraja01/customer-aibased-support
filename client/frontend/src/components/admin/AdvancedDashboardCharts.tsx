import React from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  BarChart, Bar, AreaChart, Area, Cell
} from "recharts";
import { useAuth } from "@/hooks/useAuth";
import { EyeOff } from "lucide-react";

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function useChartConfig() {
  const { orgSettings } = useAuth();
  return {
    colors: (orgSettings?.chart_colors as Record<string, string>) || {},
    showCharts: orgSettings?.show_charts !== false,
  };
}

function HiddenChartPlaceholder() {
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2 dark:border-white/[0.06] shadow-xs h-64 flex flex-col items-center justify-center text-muted-foreground">
      <EyeOff size={28} className="mb-2 opacity-40" />
      <p className="text-xs font-medium">Charts Hidden</p>
      <p className="text-[10px] text-muted-foreground/60">Enable charts in Organization Settings</p>
    </div>
  );
}

function ChartCardWrapper({ title, subtitle, children }: ChartWrapperProps) {
  const { showCharts } = useChartConfig();
  if (!showCharts) return <HiddenChartPlaceholder />;
  return (
    <div className="rounded-xl border bg-card p-4 space-y-2 dark:border-white/[0.06] shadow-xs">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{title}</p>
        {subtitle && <p className="text-[11px] text-muted-foreground/80">{subtitle}</p>}
      </div>
      <div className="h-52 w-full">{children}</div>
    </div>
  );
}

// 1. Scatter Plot (Correlation between two numerical variables)
export function ScatterPlotWidget({
  title = "Scatter Plot (Correlation)",
  data,
  xAxisKey = "x",
  yAxisKey = "y",
  xLabel = "Variable X",
  yLabel = "Variable Y",
  color
}: any) {
  const { colors } = useChartConfig();
  const fillColor = color || colors.primary || "#2563eb";
  const chartData = data || [
    { x: 10, y: 85, z: 100, name: "Sample A" },
    { x: 25, y: 92, z: 200, name: "Sample B" },
    { x: 40, y: 78, z: 150, name: "Sample C" },
    { x: 60, y: 96, z: 300, name: "Sample D" },
  ];

  return (
    <ChartCardWrapper title={title} subtitle={`${xLabel} vs ${yLabel}`}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis type="number" dataKey={xAxisKey} name={xLabel} stroke={colors.grid || "#888888"} fontSize={10} />
          <YAxis type="number" dataKey={yAxisKey} name={yLabel} stroke={colors.grid || "#888888"} fontSize={10} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Data Correlation" data={chartData} fill={fillColor} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCardWrapper>
  );
}

// 2. Histogram (Distribution across continuous numerical intervals)
export function HistogramWidget({
  title = "Histogram (Distribution)",
  data,
  color
}: any) {
  const { colors } = useChartConfig();
  const fillColor = color || colors.primary || "#059669";
  const chartData = data || [
    { interval: "0-5m", count: 32 },
    { interval: "5-15m", count: 68 },
    { interval: "15-30m", count: 45 },
    { interval: "30-60m", count: 20 },
    { interval: "60m+", count: 8 },
  ];

  return (
    <ChartCardWrapper title={title} subtitle="Continuous numerical intervals">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis dataKey="interval" stroke={colors.grid || "#888888"} fontSize={10} />
          <YAxis stroke={colors.grid || "#888888"} fontSize={10} />
          <Tooltip />
          <Bar dataKey="count" fill={fillColor} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCardWrapper>
  );
}

// 3. Area Chart (Volume / Magnitude over time)
export function AreaChartWidget({
  title = "Area Chart (Volume Trend)",
  data,
  dataKey = "volume",
  color
}: any) {
  const { colors } = useChartConfig();
  const fillColor = color || colors.secondary || "#7c3aed";
  const chartData = data || [
    { time: "W1", volume: 120 },
    { time: "W2", volume: 240 },
    { time: "W3", volume: 380 },
    { time: "W4", volume: 510 },
  ];

  return (
    <ChartCardWrapper title={title} subtitle="Magnitude & cumulative volume">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis dataKey="time" stroke={colors.grid || "#888888"} fontSize={10} />
          <YAxis stroke={colors.grid || "#888888"} fontSize={10} />
          <Tooltip />
          <Area type="monotone" dataKey={dataKey} stroke={fillColor} fill={fillColor} fillOpacity={0.25} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCardWrapper>
  );
}

// 4. Box Plot (Statistical Summary: Min, Q1, Median, Q3, Max)
export function BoxPlotWidget({
  title = "Box Plot (Statistical Summary)",
  stats,
  color
}: any) {
  const { colors } = useChartConfig();
  const fillColor = color || colors.primary || "#2563eb";
  const s = stats || { min: 2, q1: 5, median: 9, q3: 14, max: 22 };

  return (
    <ChartCardWrapper title={title} subtitle="Quartiles & Statistical Distribution">
      <div className="h-full flex flex-col justify-center px-4 space-y-4">
        <div className="relative w-full h-12 bg-muted/30 rounded-lg flex items-center px-4 border dark:border-white/[0.06]">
          <div className="absolute left-[10%] right-[10%] h-0.5" style={{ backgroundColor: fillColor, opacity: 0.4 }} />
          <div className="absolute left-[10%] h-6 w-0.5" style={{ backgroundColor: fillColor }} />
          <div className="absolute right-[10%] h-6 w-0.5" style={{ backgroundColor: fillColor }} />
          <div className="absolute left-[25%] right-[25%] h-8 rounded flex items-center justify-center border-2" style={{ backgroundColor: `${fillColor}22`, borderColor: fillColor }}>
            <div className="h-full w-0.5" style={{ backgroundColor: fillColor }} />
          </div>
        </div>

        <div className="grid grid-cols-5 text-center text-xs font-mono">
          <div><span className="text-muted-foreground text-[10px]">MIN</span><p className="font-bold">{s.min}</p></div>
          <div><span className="text-muted-foreground text-[10px]">Q1</span><p className="font-bold">{s.q1}</p></div>
          <div><span className="text-[10px]" style={{ color: fillColor }}>MEDIAN</span><p className="font-bold" style={{ color: fillColor }}>{s.median}</p></div>
          <div><span className="text-muted-foreground text-[10px]">Q3</span><p className="font-bold">{s.q3}</p></div>
          <div><span className="text-muted-foreground text-[10px]">MAX</span><p className="font-bold">{s.max}</p></div>
        </div>
      </div>
    </ChartCardWrapper>
  );
}

// 5. Heatmap (Intensity Matrix Grid)
export function HeatmapWidget({
  title = "Heatmap (Activity Intensity Matrix)",
  data,
  primaryColor
}: any) {
  const { colors } = useChartConfig();
  const baseColor = primaryColor || colors.primary || "#2563eb";
  const matrix = data || [
    { day: "Mon", h02: 10, h06: 25, h10: 80, h14: 95, h18: 60, h22: 20 },
    { day: "Tue", h02: 12, h06: 30, h10: 85, h14: 98, h18: 65, h22: 25 },
    { day: "Wed", h02: 15, h06: 35, h10: 90, h14: 100, h18: 70, h22: 30 },
    { day: "Thu", h02: 11, h06: 28, h10: 82, h14: 92, h18: 58, h22: 22 },
    { day: "Fri", h02: 9, h06: 20, h10: 75, h14: 85, h18: 50, h22: 18 },
  ];

  const getStyle = (val: number) => {
    if (val > 80) return { backgroundColor: baseColor, color: "#ffffff", fontWeight: "bold" };
    if (val > 50) return { backgroundColor: `${baseColor}aa`, color: "#ffffff" };
    if (val > 25) return { backgroundColor: `${baseColor}44`, color: "inherit" };
    return { backgroundColor: "var(--muted)", color: "var(--muted-foreground)", opacity: 0.5 };
  };

  return (
    <ChartCardWrapper title={title} subtitle="Matrix pattern across time slots">
      <div className="h-full flex flex-col justify-center space-y-1">
        <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-semibold text-muted-foreground mb-1">
          <span>Day</span><span>02:00</span><span>06:00</span><span>10:00</span><span>14:00</span><span>18:00</span><span>22:00</span>
        </div>
        {matrix.map((row: any) => (
          <div key={row.day} className="grid grid-cols-7 gap-1 text-xs">
            <span className="font-semibold text-muted-foreground flex items-center">{row.day}</span>
            <div className="p-1.5 rounded text-center text-[10px]" style={getStyle(row.h02)}>{row.h02}</div>
            <div className="p-1.5 rounded text-center text-[10px]" style={getStyle(row.h06)}>{row.h06}</div>
            <div className="p-1.5 rounded text-center text-[10px]" style={getStyle(row.h10)}>{row.h10}</div>
            <div className="p-1.5 rounded text-center text-[10px]" style={getStyle(row.h14)}>{row.h14}</div>
            <div className="p-1.5 rounded text-center text-[10px]" style={getStyle(row.h18)}>{row.h18}</div>
            <div className="p-1.5 rounded text-center text-[10px]" style={getStyle(row.h22)}>{row.h22}</div>
          </div>
        ))}
      </div>
    </ChartCardWrapper>
  );
}

// 6. Bubble Chart (3-Variable Scatter with point size extension)
export function BubbleChartWidget({
  title = "Bubble Chart (3-Variable Scaling)",
  data,
  color
}: any) {
  const { colors } = useChartConfig();
  const fillColor = color || colors.quaternary || "#0891b2";
  const chartData = data || [
    { x: 10, y: 80, z: 120, label: "Segment A" },
    { x: 25, y: 95, z: 300, label: "Segment B" },
    { x: 45, y: 65, z: 80, label: "Segment C" },
    { x: 60, y: 90, z: 220, label: "Segment D" },
  ];

  return (
    <ChartCardWrapper title={title} subtitle="X & Y coordinates + Z bubble magnitude">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis type="number" dataKey="x" stroke={colors.grid || "#888888"} fontSize={10} />
          <YAxis type="number" dataKey="y" stroke={colors.grid || "#888888"} fontSize={10} />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={chartData} fill={fillColor} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCardWrapper>
  );
}

// 7. Waterfall Chart (Sequential positive & negative changes)
export function WaterfallChartWidget({
  title = "Waterfall Chart (Sequential Change)",
  data,
  primaryColor,
  positiveColor,
  negativeColor
}: any) {
  const { colors } = useChartConfig();
  const totalColor = primaryColor || colors.primary || "#2563eb";
  const posColor = positiveColor || colors.tertiary || "#059669";
  const negColor = negativeColor || "#dc2626";
  const chartData = data || [
    { step: "Start", base: 0, value: 500, isTotal: true },
    { step: "New Sales", base: 500, value: 150 },
    { step: "Upgrades", base: 650, value: 80 },
    { step: "Churn", base: 680, value: -50 },
    { step: "Ending", base: 0, value: 680, isTotal: true },
  ];

  return (
    <ChartCardWrapper title={title} subtitle="Cumulative bridge analysis">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis dataKey="step" stroke={colors.grid || "#888888"} fontSize={10} />
          <YAxis stroke={colors.grid || "#888888"} fontSize={10} />
          <Tooltip />
          <Bar dataKey="base" stackId="a" fill="transparent" />
          <Bar dataKey="value" stackId="a" radius={[3, 3, 0, 0]}>
            {chartData.map((entry: any, index: number) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.isTotal ? totalColor : entry.value >= 0 ? posColor : negColor}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCardWrapper>
  );
}
