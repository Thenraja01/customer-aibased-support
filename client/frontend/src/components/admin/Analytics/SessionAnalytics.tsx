import { MetricCard } from '@/components/common/Charts/MetricCard';
import { DoughnutChart } from '@/components/common/Charts/DoughnutChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MessageSquare, TrendingUp, AlertTriangle } from 'lucide-react';
import type { SessionAnalytics as SessionAnalyticsType } from '@/types/analytics.types';

interface SessionAnalyticsProps {
  data: SessionAnalyticsType | null;
  loading: boolean;
}

export function SessionAnalytics({ data, loading }: SessionAnalyticsProps) {
  const satisfactionData = data?.satisfactionDistribution?.map((s) => ({
    name: `${s.rating}/5`,
    value: s.count,
    color: s.rating >= 4 ? '#22c55e' : s.rating >= 3 ? '#eab308' : '#ef4444',
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Sessions"
          value={data?.totalSessions || 0}
          icon={<MessageSquare size={18} />}
          loading={loading}
        />
        <MetricCard
          title="Avg Duration"
          value={data?.avgSessionDuration ? `${Math.round(data.avgSessionDuration / 60)}m` : '0m'}
          icon={<Clock size={18} />}
          loading={loading}
        />
        <MetricCard
          title="Avg Messages/Session"
          value={data?.avgMessagesPerSession?.toFixed(1) || '0'}
          icon={<TrendingUp size={18} />}
          loading={loading}
        />
        <MetricCard
          title="Escalation Rate"
          value={data?.escalationRate ? `${(data.escalationRate * 100).toFixed(1)}%` : '0%'}
          icon={<AlertTriangle size={18} />}
          loading={loading}
        />
      </div>
      {satisfactionData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Satisfaction Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DoughnutChart data={satisfactionData} height={280} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
