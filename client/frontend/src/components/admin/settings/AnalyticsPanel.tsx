import { useState, useEffect, useCallback } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { MessagesSquare, Ticket, Users, Cpu, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";

const PIE_COLORS = ["#2563eb", "#7c3aed", "#059669", "#f59e0b", "#ef4444", "#06b6d4"];

const fmtNum = (n: number) => {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
};

export default function AnalyticsPanel() {
  const toast = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const [oRes, uRes] = await Promise.all([
        AdminAPI.getAnalyticsOverview({ days: 30 }),
        AdminAPI.getAiUsageAnalytics({ days: 30 }),
      ]);
      setOverview(oRes.data.data);
      setUsage(uRes.data.data);
    } catch {
      toast.error("Error", "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={22} className="animate-spin text-primary" />
      </div>
    );
  }

  const ai = overview?.ai || {};
  const series = overview?.series || [];
  const providerData = (usage?.by_provider || []).map((p: any) => ({ name: p._id || "unknown", calls: p.calls, cost: Number(p.cost || 0).toFixed(2) }));
  const modelData = (usage?.by_model || []).map((m: any) => ({ name: m._id || "unknown", calls: m.calls, latency: Math.round(m.avg_latency || 0) }));

  const kpis = [
    { label: "Chats", value: fmtNum(overview?.chats?.total ?? 0), sub: `${overview?.chats?.open ?? 0} open`, icon: MessagesSquare, color: "#2563eb" },
    { label: "Tickets", value: fmtNum(overview?.tickets?.total ?? 0), sub: `${overview?.tickets?.open ?? 0} open`, icon: Ticket, color: "#f59e0b" },
    { label: "Active Users", value: fmtNum(overview?.users?.active ?? 0), sub: "members", icon: Users, color: "#059669" },
    { label: "AI Calls", value: fmtNum(ai.calls ?? 0), sub: `${ai.success_rate ?? 0}% success`, icon: Cpu, color: "#7c3aed" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Cpu size={18} className="text-primary" />
          Analytics Suite
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Support operations and AI usage over the last 30 days. All data is scoped to your organization.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border dark:border-white/[0.06] p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{k.label}</p>
              <k.icon size={16} style={{ color: k.color }} />
            </div>
            <p className="text-2xl font-bold mt-1">{k.value}</p>
            <p className="text-xs text-muted-foreground">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border dark:border-white/[0.06] p-4">
          <p className="text-sm font-semibold mb-2">AI Usage & Chat Activity</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="calls" name="AI Calls" fill="#7c3aed" radius={[3, 3, 0, 0]} />
              <Bar dataKey="chats" name="Chats" fill="#2563eb" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border dark:border-white/[0.06] p-4">
          <p className="text-sm font-semibold mb-2">Tokens per Day</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={series}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/30" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="tokens" name="Tokens" stroke="#059669" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border dark:border-white/[0.06] p-4">
          <p className="text-sm font-semibold mb-2">Calls by Provider</p>
          {providerData.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No usage recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={providerData} dataKey="calls" nameKey="name" cx="50%" cy="50%" outerRadius={80} innerRadius={40} label>
                  {providerData.map((_: any, i: number) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="rounded-xl border dark:border-white/[0.06] p-4">
          <p className="text-sm font-semibold mb-2">Top Models by Calls</p>
          {modelData.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">No usage recorded yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={modelData} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-muted/30" />
                <XAxis type="number" tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={110} />
                <Tooltip />
                <Bar dataKey="calls" name="Calls" fill="#f59e0b" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border dark:border-white/[0.06] p-4">
        <p className="text-sm font-semibold mb-3">Usage Summary (30 days)</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-lg bg-muted/40 dark:bg-white/[0.03] p-3">
            <p className="text-xs text-muted-foreground">Total Tokens</p>
            <p className="text-lg font-bold">{fmtNum(usage?.totals?.tokens ?? 0)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 dark:bg-white/[0.03] p-3">
            <p className="text-xs text-muted-foreground">Est. Cost</p>
            <p className="text-lg font-bold">${Number(usage?.totals?.cost_usd ?? 0).toFixed(2)}</p>
          </div>
          <div className="rounded-lg bg-muted/40 dark:bg-white/[0.03] p-3">
            <p className="text-xs text-muted-foreground">Avg Latency</p>
            <p className="text-lg font-bold">{Math.round(usage?.totals?.avg_latency_ms ?? 0)}ms</p>
          </div>
          <div className="rounded-lg bg-muted/40 dark:bg-white/[0.03] p-3">
            <p className="text-xs text-muted-foreground">Success Rate</p>
            <p className="text-lg font-bold">{usage?.totals?.success_rate ?? 0}%</p>
          </div>
          <div className="rounded-lg bg-muted/40 dark:bg-white/[0.03] p-3">
            <p className="text-xs text-muted-foreground">AI Feedback</p>
            <p className="text-lg font-bold">
              <Badge variant="default" className="mr-1">👍 {ai.feedback?.helpful ?? 0}</Badge>
              <Badge variant="secondary">👎 {ai.feedback?.unhelpful ?? 0}</Badge>
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 dark:bg-white/[0.03] p-3">
            <p className="text-xs text-muted-foreground">Tickets Resolved</p>
            <p className="text-lg font-bold">{overview?.tickets?.resolved ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}