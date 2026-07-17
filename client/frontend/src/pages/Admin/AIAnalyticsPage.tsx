import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { RAGAPI, AISessionAPI } from "@/api";
import { Brain, Zap, Clock, MessageSquare, TrendingUp, BarChart3 } from "lucide-react";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const TOKEN_USAGE_DATA = [
  { day: "Mon", tokens: 12400 },
  { day: "Tue", tokens: 18200 },
  { day: "Wed", tokens: 15600 },
  { day: "Thu", tokens: 22100 },
  { day: "Fri", tokens: 19800 },
  { day: "Sat", tokens: 8400 },
  { day: "Sun", tokens: 6200 },
];

const QUERY_DISTRIBUTION_DATA = [
  { name: "Successful", value: 847 },
  { name: "Failed", value: 53 },
];

const RESPONSE_TIME_DATA = [
  { day: "Mon", time: 320 },
  { day: "Tue", time: 285 },
  { day: "Wed", time: 410 },
  { day: "Thu", time: 350 },
  { day: "Fri", time: 295 },
  { day: "Sat", time: 260 },
  { day: "Sun", time: 240 },
];

const PIE_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive, 0 84% 60%))"];

export default function AIAnalyticsPage() {
  const [ragStats, setRagStats] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [ragRes, sessionRes] = await Promise.all([
        RAGAPI.getStats().catch(() => ({ data: { success: false, data: null } })),
        AISessionAPI.getStats().catch(() => ({ data: { success: false, data: null } })),
      ]);

      if (ragRes.data.success) setRagStats(ragRes.data.data);
      if (sessionRes.data.success) setSessionStats(sessionRes.data.data);
    } catch (error) {
      console.error("Failed to load AI analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading AI analytics...</div>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">AI Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Monitor AI performance, token usage, and session metrics.
        </p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <motion.div variants={scaleIn} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold mt-2">{sessionStats?.totalSessions || ragStats?.totalQueries || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <MessageSquare size={20} className="text-primary" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={scaleIn} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tokens Used</p>
              <p className="text-2xl font-bold mt-2">{sessionStats?.totalTokens || ragStats?.totalTokens || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center">
              <Zap size={20} className="text-secondary" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={scaleIn} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-bold mt-2">{ragStats?.avgResponseTime || sessionStats?.avgResponseTime || 0}ms</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Clock size={20} className="text-accent-foreground" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={scaleIn} initial="initial" animate="animate" transition={{ duration: 0.3 }} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documents Indexed</p>
              <p className="text-2xl font-bold mt-2">{ragStats?.documentsIndexed || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <Brain size={20} className="text-primary" />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Charts */}
      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-primary" />
            Token Usage Over Time
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={TOKEN_USAGE_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Line type="monotone" dataKey="tokens" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-secondary" />
            Query Distribution
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={QUERY_DISTRIBUTION_DATA}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {QUERY_DISTRIBUTION_DATA.map((_entry, index) => (
                    <Cell key={index} fill={PIE_COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Clock size={18} className="text-accent-foreground" />
            Response Time Trend
          </h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={RESPONSE_TIME_DATA}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: any) => [`${value}ms`, "Avg Response Time"]}
                />
                <Bar dataKey="time" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Detailed Stats */}
      <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            RAG Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Queries</span>
              <span className="text-sm font-medium">{ragStats?.totalQueries || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Successful Queries</span>
              <span className="text-sm font-medium">{ragStats?.successfulQueries || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Retrieval Score</span>
              <span className="text-sm font-medium">{ragStats?.avgScore || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Chunks Retrieved</span>
              <span className="text-sm font-medium">{ragStats?.chunksRetrieved || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-secondary" />
            Session Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Sessions</span>
              <span className="text-sm font-medium">{sessionStats?.totalSessions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Messages</span>
              <span className="text-sm font-medium">{sessionStats?.totalMessages || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Tokens per Session</span>
              <span className="text-sm font-medium">{sessionStats?.avgTokensPerSession || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Messages per Session</span>
              <span className="text-sm font-medium">{sessionStats?.avgMessagesPerSession || 0}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Knowledge Graph Stats */}
      {ragStats?.graphStats && (
        <motion.div variants={staggerItem} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Brain size={18} className="text-primary" />
            Knowledge Graph Statistics
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Nodes</span>
              <span className="text-sm font-medium">{ragStats.graphStats.totalNodes || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Edges</span>
              <span className="text-sm font-medium">{ragStats.graphStats.totalEdges || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Documents Processed</span>
              <span className="text-sm font-medium">{ragStats.graphStats.documentsProcessed || 0}</span>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
