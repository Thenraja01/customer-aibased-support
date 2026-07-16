import { Users, Building2, Shield, Activity, UserX, UserCheck } from "lucide-react";
import StatsCard from "@/components/admin/StatsCard";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuperAdminDashboard() {
  const { dashboardStats, loading } = useAdminDashboard();

  if (loading && !dashboardStats) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading dashboard...</div>;
  }

  const stats = dashboardStats;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">System-wide overview and management.</p>
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

      {stats?.orgStats && stats.orgStats.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Organizations Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Organization</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Org ID</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Users</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.orgStats.map((org) => (
                    <tr key={org.organizationId} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4 font-medium">{org.name}</td>
                      <td className="py-3 px-4 text-muted-foreground">{org.organization_id}</td>
                      <td className="py-3 px-4 text-right">{org.userCount}</td>
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
