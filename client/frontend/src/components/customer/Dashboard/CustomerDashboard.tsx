import { DashboardStats } from './DashboardStats';
import { QuickActions } from './QuickActions';

export function CustomerDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to your support portal</p>
      </div>
      <DashboardStats />
      <QuickActions />
    </div>
  );
}
