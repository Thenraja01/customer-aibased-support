import { useEffect, useState } from "react";
import { Users, Building2, Shield, Activity, UserX, UserCheck, BarChart3, Sparkles } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MockAdminAPI as AdminAPI } from "@/api/mockAdminApi";
import {
  HeatmapWidget, HistogramWidget, AreaChartWidget
} from "@/components/admin/AdvancedDashboardCharts";

export default function SuperAdminDashboard() {
  const { dashboardStats, loading } = useAdminDashboard();
  const [telemetry, setTelemetry] = useState<any>(null);

  useEffect(() => {
    AdminAPI.getCommandCenterStatus()
      .then((res: any) => {
        if (res.data?.success) {
          setTelemetry(res.data.data?.charts);
        }
      })
      .catch(() => {});
  }, []);

  const stats = dashboardStats;

  if (loading && !dashboardStats) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-white/[0.06]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="text-primary" size={28} />
            Super Admin Dashboard
          </h1>
          <p className="text-muted-foreground text-sm">System-wide overview, multi-tenant statistics, and operational telemetry.</p>
        </div>
      </div>

      {/* Overview Stats Cards */}
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
                  </tr>
                </thead>
                <tbody>
                  {stats.orgStats.map((org) => (
                    <tr key={org.organizationId} className="border-b dark:border-white/[0.06] hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{org.name}</td>
                      <td className="py-3 px-4 text-muted-foreground font-mono">{org.organization_id}</td>
                      <td className="py-3 px-4 text-right font-bold">{org.userCount}</td>
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
