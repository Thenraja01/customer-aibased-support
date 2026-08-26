import React from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  BarChart, Bar, AreaChart, Area, Cell
} from "recharts";
import { EyeOff } from "lucide-react";

interface ChartWrapperProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

function useChartConfig() {
  return {
    colors: {
      primary: "hsl(var(--primary))",
      secondary: "hsl(var(--flax))",
      tertiary: "hsl(var(--success))",
      quaternary: "hsl(var(--info))",
      caution: "hsl(var(--caution))",
      danger: "hsl(var(--danger))",
      grid: "hsl(var(--muted-foreground))",
    },
    showCharts: true,
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
        <p className="text-xs font-bold uppercase  text-muted-foreground">{title}</p>
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
  const fillColor = color || colors.primary;
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
          <XAxis type="number" dataKey={xAxisKey} name={xLabel} stroke={colors.grid} fontSize={10} />
          <YAxis type="number" dataKey={yAxisKey} name={yLabel} stroke={colors.grid} fontSize={10} />
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
  const fillColor = color || colors.tertiary;
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
          <XAxis dataKey="interval" stroke={colors.grid} fontSize={10} />
          <YAxis stroke={colors.grid} fontSize={10} />
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
  const fillColor = color || colors.secondary;
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
          <XAxis dataKey="time" stroke={colors.grid} fontSize={10} />
          <YAxis stroke={colors.grid} fontSize={10} />
          <Tooltip />
          <Area type="monotone" dataKey={dataKey} stroke={fillColor} fill={fillColor} fillOpacity={0.25} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCardWrapper>
  );
}

// 4. Dot Plot (Categorical comparisons)
export function DotPlotWidget({
  title = "Dot Plot (Category Rank)",
  data,
  categoryKey = "category",
  valueKey = "score",
  color
}: any) {
  const { colors } = useChartConfig();
  const fillColor = color || colors.primary;
  const chartData = data || [
    { category: "AI Accuracy", score: 94 },
    { category: "SLA Speed", score: 88 },
    { category: "CSAT Rate", score: 91 },
    { category: "First Contact", score: 76 },
  ];

  return (
    <ChartCardWrapper title={title} subtitle="Discrete category position">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 10, bottom: 10, left: 20 }}>
          <XAxis type="number" stroke={colors.grid} fontSize={10} />
          <YAxis type="category" dataKey={categoryKey} stroke={colors.grid} fontSize={10} />
          <Tooltip />
          <Bar dataKey={valueKey} fill={fillColor} barSize={8} radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCardWrapper>
  );
}

// 5. Heatmap Grid Representation
export function HeatmapWidget({
  title = "Heatmap (Intensity Grid)",
  matrix,
  rowLabels,
  colLabels,
  primaryColor
}: any) {
  const { colors } = useChartConfig();
  const baseColor = primaryColor || colors.primary;
  const rows = rowLabels || ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const cols = colLabels || ["08:00", "12:00", "16:00", "20:00"];
  const gridData = matrix || [
    [20, 60, 90, 30],
    [35, 80, 100, 45],
    [40, 85, 95, 50],
    [25, 70, 88, 40],
    [15, 50, 65, 20],
  ];

  const getCellBg = (val: number) => {
    if (val > 80) return { backgroundColor: baseColor, color: "hsl(var(--primary-foreground))", fontWeight: "bold" };
    if (val > 50) return { backgroundColor: baseColor, opacity: 0.7, color: "hsl(var(--primary-foreground))" };
    if (val > 30) return { backgroundColor: baseColor, opacity: 0.4, color: "hsl(var(--foreground))" };
    return { backgroundColor: "hsl(var(--muted))", color: "hsl(var(--muted-foreground))" };
  };

  return (
    <ChartCardWrapper title={title} subtitle="Two-dimensional matrix density">
      <div className="flex flex-col h-full justify-between py-1">
        <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
          <div className="text-muted-foreground font-semibold">Day</div>
          {cols.map((c: string, idx: number) => (
            <div key={idx} className="text-muted-foreground">{c}</div>
          ))}
        </div>
        {rows.map((r: string, rIdx: number) => (
          <div key={rIdx} className="grid grid-cols-5 gap-1.5 items-center">
            <span className="text-[10px] text-muted-foreground font-medium truncate">{r}</span>
            {gridData[rIdx]?.map((val: number, cIdx: number) => (
              <div
                key={cIdx}
                style={getCellBg(val)}
                className="h-7 rounded-md flex items-center justify-center text-[10px] transition-all hover:scale-105 shadow-2xs"
                title={`${r} ${cols[cIdx]}: ${val}`}
              >
                {val}
              </div>
            ))}
          </div>
        ))}
      </div>
    </ChartCardWrapper>
  );
}

// 6. Bubble Chart (Three numerical variables)
export function BubbleChartWidget({
  title = "Bubble Chart (3-Variable Matrix)",
  data,
  color
}: any) {
  const { colors } = useChartConfig();
  const fillColor = color || colors.quaternary;
  const chartData = data || [
    { x: 10, y: 30, z: 200, name: "Queue A" },
    { x: 45, y: 70, z: 450, name: "Queue B" },
    { x: 75, y: 40, z: 300, name: "Queue C" },
    { x: 90, y: 90, z: 600, name: "Queue D" },
  ];

  return (
    <ChartCardWrapper title={title} subtitle="X, Y coordinates + Bubble size Z">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis type="number" dataKey="x" stroke={colors.grid} fontSize={10} />
          <YAxis type="number" dataKey="y" stroke={colors.grid} fontSize={10} />
          <ZAxis type="number" dataKey="z" range={[60, 400]} />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter name="Bubble Matrix" data={chartData} fill={fillColor} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCardWrapper>
  );
}

// 7. Waterfall Chart (Cumulative positive & negative steps)
export function WaterfallChartWidget({
  title = "Waterfall Chart (Cumulative Flow)",
  data,
  primaryColor,
  positiveColor,
  negativeColor
}: any) {
  const { colors } = useChartConfig();
  const totalColor = primaryColor || colors.primary;
  const posColor = positiveColor || colors.tertiary;
  const negColor = negativeColor || colors.danger;

  const chartData = data || [
    { step: "Initial", value: 100, isTotal: true },
    { step: "New Tickets", value: 45, isTotal: false },
    { step: "Resolved", value: -60, isTotal: false },
    { step: "Escalated", value: 15, isTotal: false },
    { step: "Net Queue", value: 100, isTotal: true },
  ];

  return (
    <ChartCardWrapper title={title} subtitle="Sequential gains & losses impact">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
          <XAxis dataKey="step" stroke={colors.grid} fontSize={10} />
          <YAxis stroke={colors.grid} fontSize={10} />
          <Tooltip />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {chartData.map((entry: any, index: number) => {
              const fillColor = entry.isTotal ? totalColor : entry.value >= 0 ? posColor : negColor;
              return <Cell key={`cell-${index}`} fill={fillColor} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCardWrapper>
  );
}
