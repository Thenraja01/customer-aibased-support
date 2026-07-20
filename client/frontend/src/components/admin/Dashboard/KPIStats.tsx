import { MetricCard } from '@/components/common/Charts/MetricCard';
import { Users, Building2, MessageCircle, Ticket } from 'lucide-react';
import type { DashboardStats } from '@/types/analytics.types';

interface KPIStatsProps {
  stats: DashboardStats | null;
  loading: boolean;
}

export function KPIStats({ stats, loading }: KPIStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Users"
        value={stats?.totalUsers || 0}
        icon={<Users size={18} />}
        loading={loading}
      />
      <MetricCard
        title="Active Users"
        value={stats?.activeUsers || 0}
        icon={<Building2 size={18} />}
        trend={{ value: 12, isUp: true }}
        loading={loading}
      />
      <MetricCard
        title="Total Chats"
        value={stats?.totalChats || 0}
        icon={<MessageCircle size={18} />}
        loading={loading}
      />
      <MetricCard
        title="Total Tickets"
        value={stats?.totalTickets || 0}
        icon={<Ticket size={18} />}
        loading={loading}
      />
    </div>
  );
}
