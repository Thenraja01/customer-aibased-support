import { MetricCard } from '@/components/common/Charts/MetricCard';
import { BarChart } from '@/components/common/Charts/BarChart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, ThumbsUp, MessageSquare, Activity } from 'lucide-react';
import type { AIAnalytics } from '@/types/analytics.types';

interface AIAnalyticsProps {
  data: AIAnalytics | null;
  loading: boolean;
}

export function AIAnalytics({ data, loading }: AIAnalyticsProps) {
  const queryData = data?.topQueries?.map((q) => ({
    name: q.query.length > 20 ? q.query.substring(0, 20) + '...' : q.query,
    count: q.count,
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="AI Responses"
          value={data?.totalAIResponses || 0}
          icon={<Brain size={18} />}
          loading={loading}
        />
        <MetricCard
          title="Avg Confidence"
          value={data?.avgAIConfidence ? `${(data.avgAIConfidence * 100).toFixed(1)}%` : '0%'}
          icon={<Activity size={18} />}
          loading={loading}
        />
        <MetricCard
          title="Helpfulness"
          value={data?.helpfulnessRate ? `${(data.helpfulnessRate * 100).toFixed(1)}%` : '0%'}
          icon={<ThumbsUp size={18} />}
          loading={loading}
        />
        <MetricCard
          title="Feedback Rate"
          value={data?.feedbackRate ? `${(data.feedbackRate * 100).toFixed(1)}%` : '0%'}
          icon={<MessageSquare size={18} />}
          loading={loading}
        />
      </div>
      {queryData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={queryData} xKey="name" yKey="count" height={250} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
