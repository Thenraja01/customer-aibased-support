import React from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip,
  BarChart, Bar, AreaChart, Area, Cell, Line, ComposedChart
} from "recharts";
import { EyeOff, Activity, DollarSign, TrendingUp, ShieldCheck, Sparkles, Zap } from "lucide-react";

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

// 8. SuperAdmin Dimension 1: Tenant Platform Health & Churn Risk Matrix
export function TenantHealthWidget({ data }: any) {
  const health = data || {
    score: 92,
    churnRisk: "Low (1.8%)",
    status: "Healthy & Highly Active",
    activeAgents: 4,
    totalKnowledgeDocs: 8,
    totalInteractions: 140,
    weeklyTrend: [
      { day: "Mon", activity: 78, queries: 14 },
      { day: "Tue", activity: 85, queries: 22 },
      { day: "Wed", activity: 94, queries: 28 },
      { day: "Thu", activity: 90, queries: 24 },
      { day: "Fri", activity: 88, queries: 18 },
      { day: "Sat", activity: 62, queries: 8 },
      { day: "Sun", activity: 58, queries: 6 },
    ],
  };

  const isHealthy = health.score >= 70;
  const isModerate = health.score >= 45 && health.score < 70;

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity size={16} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Tenant Health & Churn Risk</p>
              <p className="text-[11px] text-muted-foreground">Engagement velocity & account stability</p>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
            isHealthy ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
            isModerate ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
            "bg-rose-500/10 text-rose-400 border-rose-500/20"
          }`}>
            {health.churnRisk} Churn Risk
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-3xl font-extrabold font-mono text-foreground">{health.score}</span>
          <span className="text-xs text-muted-foreground font-medium">/ 100 Health Score</span>
        </div>
        <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
          <ShieldCheck size={12} /> {health.status}
        </p>

        {/* 7-Day Activity Curve */}
        <div className="h-28 w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={health.weeklyTrend} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
              <defs>
                <linearGradient id="healthGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }}
              />
              <Area type="monotone" dataKey="activity" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#healthGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Health Indicator Pills */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40 text-center">
        <div className="p-1.5 rounded-lg bg-muted/30">
          <p className="text-[10px] text-muted-foreground">Active Staff</p>
          <p className="text-xs font-bold text-foreground mt-0.5">{health.activeAgents} Agents</p>
        </div>
        <div className="p-1.5 rounded-lg bg-muted/30">
          <p className="text-[10px] text-muted-foreground">Knowledge</p>
          <p className="text-xs font-bold text-foreground mt-0.5">{health.totalKnowledgeDocs} Docs</p>
        </div>
        <div className="p-1.5 rounded-lg bg-muted/30">
          <p className="text-[10px] text-muted-foreground">Activity</p>
          <p className="text-xs font-bold text-foreground mt-0.5">{health.totalInteractions} Events</p>
        </div>
      </div>
    </div>
  );
}

// 9. SuperAdmin Dimension 2: Platform Infrastructure Cost vs Subscription Margin
export function TenantProfitMarginWidget({ data }: any) {
  const margin = data || {
    planName: "ENTERPRISE",
    monthlyRevenue: 199,
    computeCost: 14.8,
    storageCost: 4.2,
    totalInfraCost: 19.0,
    grossMarginPercent: 90.4,
    netProfit: 180.0,
    marginBridge: [
      { period: "Wk 1", revenue: 199, infraCost: 4.2, netMargin: 194.8 },
      { period: "Wk 2", revenue: 199, infraCost: 5.1, netMargin: 193.9 },
      { period: "Wk 3", revenue: 199, infraCost: 5.4, netMargin: 193.6 },
      { period: "Wk 4", revenue: 199, infraCost: 4.3, netMargin: 194.7 },
    ],
  };

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <DollarSign size={16} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Infra Cost vs Revenue Margin</p>
              <p className="text-[11px] text-muted-foreground">Compute & storage profitability</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
            {margin.grossMarginPercent}% Margin
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-3xl font-extrabold font-mono text-emerald-400">${margin.netProfit}</span>
          <span className="text-xs text-muted-foreground font-medium">/ mo Net Margin (MRR ${margin.monthlyRevenue})</span>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
          <span>Infra Spend: <strong>${margin.totalInfraCost}/mo</strong> (LLM: ${margin.computeCost} • Storage: ${margin.storageCost})</span>
        </p>

        {/* Profitability Composed Bar Chart */}
        <div className="h-28 w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={margin.marginBridge} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
              <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }}
              />
              <Bar dataKey="revenue" name="Plan MRR ($)" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.3} />
              <Bar dataKey="infraCost" name="Infra Cost ($)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="netMargin" name="Net Profit ($)" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Margin Breakdown Pills */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/40 text-center">
        <div className="p-1.5 rounded-lg bg-muted/30">
          <p className="text-[10px] text-muted-foreground">Plan MRR</p>
          <p className="text-xs font-bold text-foreground mt-0.5">${margin.monthlyRevenue}</p>
        </div>
        <div className="p-1.5 rounded-lg bg-muted/30">
          <p className="text-[10px] text-muted-foreground">LLM Tokens</p>
          <p className="text-xs font-bold text-rose-400 mt-0.5">${margin.computeCost}</p>
        </div>
        <div className="p-1.5 rounded-lg bg-muted/30">
          <p className="text-[10px] text-muted-foreground">Net Profit</p>
          <p className="text-xs font-bold text-emerald-400 mt-0.5">${margin.netProfit}</p>
        </div>
      </div>
    </div>
  );
}

// 10. SuperAdmin Dimension 3: Tenant Expansion Velocity & Upsell Runway
export function TenantExpansionVelocityWidget({ data }: any) {
  const expansion = data || {
    growthRateMoM: "+38.4%",
    quotaUsedPercent: 68,
    upsellStatus: "Healthy Utilization",
    recommendation: "Platform usage is stable with healthy capacity remaining.",
    velocityTrend: [
      { month: "Month 1", activeSeats: 2, monthlyQueries: 350 },
      { month: "Month 2", activeSeats: 4, monthlyQueries: 620 },
      { month: "Current", activeSeats: 6, monthlyQueries: 1100 },
    ],
  };

  const isUpsellReady = expansion.quotaUsedPercent >= 80;

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4 shadow-sm flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <TrendingUp size={16} />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">3. Expansion & Upsell Runway</p>
              <p className="text-[11px] text-muted-foreground">Usage velocity & upgrade readiness</p>
            </div>
          </div>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
            isUpsellReady ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}>
            {expansion.growthRateMoM} MoM
          </span>
        </div>

        <div className="flex items-baseline gap-2 mt-4">
          <span className="text-3xl font-extrabold font-mono text-foreground">{expansion.quotaUsedPercent}%</span>
          <span className="text-xs text-muted-foreground font-medium">Plan Quota Utilized</span>
        </div>
        <p className="text-[11px] text-amber-400 font-medium flex items-center gap-1 mt-0.5">
          <Zap size={12} /> {expansion.upsellStatus}
        </p>

        {/* Growth Velocity Dual Area Chart */}
        <div className="h-28 w-full mt-3">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={expansion.velocityTrend} margin={{ top: 5, right: 5, bottom: 0, left: -25 }}>
              <defs>
                <linearGradient id="expansionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#1e293b", borderRadius: "8px", fontSize: "11px" }}
              />
              <Area type="monotone" dataKey="monthlyQueries" name="Inbound Queries" stroke="#f59e0b" fill="url(#expansionGrad)" />
              <Line type="monotone" dataKey="activeSeats" name="Staff Seats" stroke="#38bdf8" strokeWidth={2} dot={{ r: 3 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Upsell Recommendation Alert */}
      <div className="pt-3 border-t border-border/40">
        <div className="p-2 rounded-lg bg-muted/40 flex items-start gap-2 text-[11px] text-muted-foreground">
          <Sparkles size={13} className="text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-tight">{expansion.recommendation}</span>
        </div>
      </div>
    </div>
  );
}
