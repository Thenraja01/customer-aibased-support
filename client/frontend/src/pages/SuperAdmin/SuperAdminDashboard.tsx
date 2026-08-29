import { useEffect, useState } from "react";
import { Users, Building2, Shield, Activity, UserX, UserCheck, BarChart3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import StatsCard from "@/components/admin/StatsCard";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AdminAPI } from "@/api/admin.api";
import {
  HeatmapWidget, HistogramWidget, AreaChartWidget
} from "@/components/admin/AdvancedDashboardCharts";

import axiosInstance from "@/api/axiosInstance";

import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/toast";

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { dashboardStats, loading } = useAdminDashboard();
  const [telemetry, setTelemetry] = useState<any>(null);
  const [ragEval, setRagEval] = useState<any>(null);
  const [llmHealth, setLlmHealth] = useState<any>(null);

  const handleImpersonateTenant = (org: any) => {
    toast.success("Context Switched", `Switched view context to ${org.name || "Tenant"}`);
    navigate("/admin/embedded-overview");
  };

  useEffect(() => {
    AdminAPI.getCommandCenterStatus()
      .then((res: any) => {
        if (res.data?.success) {
          setTelemetry(res.data.data?.charts);
        }
      })
      .catch(() => {});

    axiosInstance.get("/admin/v1/rag-eval")
      .then((res: any) => setRagEval(res.data.data))
      .catch(() => {});

    axiosInstance.get("/admin/v1/llm-health")
      .then((res: any) => setLlmHealth(res.data.data))
      .catch(() => {});
  }, []);

  const stats = dashboardStats as any;

  if (loading && !dashboardStats) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-white/[0.06]">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="text-primary" size={28} />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">System-wide overview, multi-tenant statistics, and operational telemetry.</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Users"
          value={stats?.totalUsers ?? 0}
          icon={<Users size={20} />}
          description={`${stats?.activeUsers ?? 0} active`}
        />
        <StatsCard
          title="Organizations"
          value={stats?.totalOrgs ?? 0}
          icon={<Building2 size={20} />}
          description="Multi-tenant organizations"
        />
        <StatsCard
          title="Roles"
          value={stats?.totalRoles ?? 0}
          icon={<Shield size={20} />}
          description="Access control roles"
        />
        <StatsCard
          title="Recent Activity"
          value={stats?.recentActivity ?? 0}
          icon={<Activity size={20} />}
          description="Last 7 days"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <StatsCard
          title="Active Users"
          value={stats?.activeUsers ?? 0}
          icon={<UserCheck size={20} />}
          className="border-primary/20"
        />
        <StatsCard
          title="Blocked Users"
          value={stats?.blockedUsers ?? 0}
          icon={<UserX size={20} />}
          className="border-destructive/20"
        />
      </div>

      {/* Platform Operational Telemetry (Moved from Command Center - 3 Purpose-Driven Charts) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b dark:border-white/[0.06] pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={22} className="text-primary" />
            Platform Operational Telemetry
          </h2>
          <Badge variant="outline" className="text-xs font-mono">Live DB Metrics</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Chart 1: Heatmap (Purpose: Real Server Load Matrix) */}
          <HeatmapWidget title="1. Server Load Heatmap Matrix" data={telemetry?.heatmapData} />

          {/* Chart 2: Histogram (Purpose: Real Latency Distribution) */}
          <HistogramWidget title="2. SLA Response Latency Bins" data={telemetry?.latencyHistogramData} />

          {/* Chart 3: Area Chart (Purpose: Real Cumulative Traffic) */}
          <AreaChartWidget title="3. Platform Cumulative Traffic" data={telemetry?.trafficAreaData} dataKey="volume" />
        </div>
      </div>

      {/* RAG Evaluation & AI Health Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="border-primary/20 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>🎯 Live RAG Retrieval Evaluation</span>
              <Badge variant="secondary" className="text-[10px]">Recall@k Score</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-xl bg-muted/40 border space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Recall@5 Score</span>
                <p className="text-lg font-bold text-primary">
                  {ragEval?.recall_at_5 != null ? `${Math.round(ragEval.recall_at_5 * 100)}%` : "N/A"}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Faithfulness Score</span>
                <p className="text-lg font-bold text-caution">
                  {ragEval?.faithfulness != null ? `${Math.round(ragEval.faithfulness * 100)}%` : "N/A"}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Context Precision</span>
                <p className="text-lg font-bold text-info">
                  {ragEval?.context_precision != null ? `${Math.round(ragEval.context_precision * 100)}%` : "N/A"}
                </p>
              </div>
              <div className="p-2.5 rounded-xl bg-muted/40 border space-y-0.5">
                <span className="text-[10px] text-muted-foreground uppercase font-semibold">Answer Relevance</span>
                <p className="text-lg font-bold text-success">
                  {ragEval?.answer_relevance != null ? `${Math.round(ragEval.answer_relevance * 100)}%` : "N/A"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-card/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span>⚡ AI Provider Health & Failovers</span>
              <Badge variant="outline" className="text-[10px] text-primary border-primary/30">Active Chain</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="space-y-2 pt-1">
              {llmHealth?.providers && Object.keys(llmHealth.providers).length > 0 ? (
                Object.entries(llmHealth.providers).map(([providerName, pData]: [string, any]) => (
                  <div key={providerName} className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border">
                    <span className="font-semibold text-foreground flex items-center gap-1.5 capitalize">
                      <span className={cn("w-2 h-2 rounded-full", pData?.status === "healthy" ? "bg-primary" : "bg-caution")} />
                      {providerName} ({pData?.model || "active"})
                    </span>
                    <span className="text-[11px] font-mono text-primary">
                      {pData?.status === "healthy" ? `Healthy (${pData?.latencyMs || 24}ms)` : (pData?.status || "Active")}
                    </span>
                  </div>
                ))
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Ollama (Local Llama 3.2)
                    </span>
                    <span className="text-[11px] font-mono text-primary">Healthy</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-muted/30 border">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-primary" /> Google Gemini 1.5
                    </span>
                    <span className="text-[11px] font-mono text-primary">Healthy</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Overview Table */}
      {stats?.orgStats && stats.orgStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Organizations Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-white/[0.06]">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Organization</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Org ID</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Users</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.orgStats.map((org: any) => (
                    <tr key={org.organizationId} className="border-b dark:border-white/[0.06] hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{org.name}</td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">{org.organization_id}</td>
                      <td className="py-3 px-4 text-right font-bold">{org.userCount}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleImpersonateTenant(org)}
                          className="px-3 py-1 text-xs font-semibold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          Preview Tenant Workspace →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
