import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  Zap,
  TrendingUp,
  Calendar,
  Building2,
  RefreshCw,
  BarChart3,
  DollarSign,
} from "lucide-react";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import { AISessionAPI } from "@/api";
import { cn } from "@/lib/utils";

interface OrgTokenData {
  orgId: string;
  orgName: string;
  totalTokens: number;
  totalSessions: number;
  avgTokensPerSession: number;
  estimatedCost: number;
}

const MOCK_ORG_TOKENS: OrgTokenData[] = [
  { orgId: "org_1", orgName: "Acme Corp", totalTokens: 2450000, totalSessions: 1840, avgTokensPerSession: 1331, estimatedCost: 49.0 },
  { orgId: "org_2", orgName: "TechStart Inc", totalTokens: 1120000, totalSessions: 920, avgTokensPerSession: 1217, estimatedCost: 22.4 },
  { orgId: "org_3", orgName: "Global Solutions", totalTokens: 890000, totalSessions: 715, avgTokensPerSession: 1244, estimatedCost: 17.8 },
  { orgId: "org_4", orgName: "LocalBiz", totalTokens: 340000, totalSessions: 310, avgTokensPerSession: 1096, estimatedCost: 6.8 },
  { orgId: "org_5", orgName: "DataFlow Ltd", totalTokens: 780000, totalSessions: 590, avgTokensPerSession: 1322, estimatedCost: 15.6 },
  { orgId: "org_6", orgName: "InnovateHub", totalTokens: 1650000, totalSessions: 1200, avgTokensPerSession: 1375, estimatedCost: 33.0 },
  { orgId: "org_7", orgName: "Pinnacle Systems", totalTokens: 560000, totalSessions: 445, avgTokensPerSession: 1258, estimatedCost: 11.2 },
  { orgId: "org_8", orgName: "BrightPath AI", totalTokens: 210000, totalSessions: 180, avgTokensPerSession: 1166, estimatedCost: 4.2 },
];

const MOCK_TREND = [
  { month: "Jan", tokens: 420000, sessions: 310 },
  { month: "Feb", tokens: 580000, sessions: 420 },
  { month: "Mar", tokens: 710000, sessions: 530 },
  { month: "Apr", tokens: 890000, sessions: 680 },
  { month: "May", tokens: 1050000, sessions: 810 },
  { month: "Jun", tokens: 1320000, sessions: 1020 },
  { month: "Jul", tokens: 1580000, sessions: 1240 },
];

function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function formatCost(n: number) {
  return `$${n.toFixed(2)}`;
}

export default function TokenUsagePage() {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState<"totalTokens" | "totalSessions" | "estimatedCost">("totalTokens");

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const res = await AISessionAPI.getStats();
      if (res.data.success) {}
    } catch (error) {
      console.error("Failed to load session stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const sortedData = useMemo(() => {
    return [...MOCK_ORG_TOKENS].sort((a, b) => b[sortBy] - a[sortBy]);
  }, [sortBy]);

  const totalTokens = MOCK_ORG_TOKENS.reduce((s, o) => s + o.totalTokens, 0);
  const totalSessions = MOCK_ORG_TOKENS.reduce((s, o) => s + o.totalSessions, 0);
  const totalCost = MOCK_ORG_TOKENS.reduce((s, o) => s + o.estimatedCost, 0);
  const avgPerSession = totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground">
        Loading token usage analytics...
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Token Usage Analytics</h1>
          <p className="text-muted-foreground">Monitor token consumption across organizations.</p>
        </div>
        <Button variant="outline" size="sm" onClick={loadStats}>
          <RefreshCw size={14} className="mr-1" /> Refresh
        </Button>
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tokens</p>
              <p className="text-2xl font-bold mt-2">{formatTokens(totalTokens)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <Zap size={20} className="text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold mt-2">{totalSessions.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center">
              <BarChart3 size={20} className="text-secondary" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Tokens/Session</p>
              <p className="text-2xl font-bold mt-2">{avgPerSession.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <TrendingUp size={20} className="text-accent-foreground" />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={scaleIn}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.3 }}
          className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Est. Total Cost</p>
              <p className="text-2xl font-bold mt-2">{formatCost(totalCost)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center">
              <DollarSign size={20} className="text-green-500" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2">
        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 size={18} className="text-primary" /> Tokens by Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={sortedData}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="orgName"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    angle={-35}
                    textAnchor="end"
                    height={80}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatTokens(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any) => [formatTokens(value), "Tokens"]}
                  />
                  <Bar
                    dataKey="totalTokens"
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={48}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-card/50 dark:border-white/[0.06]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp size={18} className="text-secondary" /> Usage Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={MOCK_TREND}
                  margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="month"
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => formatTokens(v)}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: any, name: any) => [
                      name === "tokens" ? formatTokens(value) : value,
                      name === "tokens" ? "Tokens" : "Sessions",
                    ]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="tokens"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sessions"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--secondary))", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full h-9 rounded-md border bg-transparent pl-9 pr-2.5 text-sm dark:border-white/[0.06]"
          />
        </div>
        <span className="text-xs text-muted-foreground">to</span>
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="h-9 rounded-md border bg-transparent px-2.5 text-sm dark:border-white/[0.06]"
        />
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="totalTokens">Total Tokens</SelectItem>
            <SelectItem value="totalSessions">Total Sessions</SelectItem>
            <SelectItem value="estimatedCost">Est. Cost</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Rank</TableHead>
              <TableHead>Organization</TableHead>
              <TableHead className="text-right">Total Tokens</TableHead>
              <TableHead className="text-right">Sessions</TableHead>
              <TableHead className="text-right">Avg Tokens/Session</TableHead>
              <TableHead className="text-right">Est. Cost</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedData.map((org, idx) => (
              <TableRow key={org.orgId}>
                <TableCell>
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      idx === 0
                        ? "bg-amber-500/10 text-amber-500"
                        : idx === 1
                          ? "bg-slate-400/10 text-slate-400"
                          : idx === 2
                            ? "bg-orange-500/10 text-orange-500"
                            : "bg-muted text-muted-foreground"
                    )}
                  >
                    {idx + 1}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                      <Building2 size={14} className="text-primary" />
                    </div>
                    <span className="font-medium">{org.orgName}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <span className="font-medium">{formatTokens(org.totalTokens)}</span>
                </TableCell>
                <TableCell className="text-right">{org.totalSessions.toLocaleString()}</TableCell>
                <TableCell className="text-right">{org.avgTokensPerSession.toLocaleString()}</TableCell>
                <TableCell className="text-right">
                  <span className="font-medium text-green-500">{formatCost(org.estimatedCost)}</span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </motion.div>
  );
}
