import { useEffect } from 'react';
import { KPIStats } from './KPIStats';
import { RecentActivity } from './RecentActivity';
import { QuickStats } from './QuickStats';
import { useAdminDashboard } from '@/hooks/useAdminDashboard';

export function AdminDashboard() {
  const { dashboardStats: rawStats, loading, fetchDashboardData } = useAdminDashboard();
  const stats = rawStats as any;

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Overview of your support platform</p>
      </div>
      <KPIStats stats={stats} loading={loading} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QuickStats stats={stats} loading={loading} />
        <RecentActivity activities={stats?.recentActivity || []} loading={loading} />
      </div>
    </div>
  );
}
