import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/common/Charts/LineChart';
import { MetricCard } from '@/components/common/Charts/MetricCard';
import { DollarSign, Cpu } from 'lucide-react';
import type { TokenUsage as TokenUsageType } from '@/types/analytics.types';

interface TokenUsageProps {
  data: TokenUsageType[];
  loading: boolean;
}

export function TokenUsage({ data, loading }: TokenUsageProps) {
  const totalTokens = data.reduce((sum, d) => sum + d.totalTokens, 0);
  const totalCost = data.reduce((sum, d) => sum + d.cost, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <MetricCard
          title="Total Tokens"
          value={totalTokens.toLocaleString()}
          icon={<Cpu size={18} />}
          loading={loading}
        />
        <MetricCard
          title="Total Cost"
          value={`$${totalCost.toFixed(2)}`}
          icon={<DollarSign size={18} />}
          loading={loading}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Token Usage Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="h-[300px] bg-muted animate-pulse rounded" />
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No data available</div>
          ) : (
            <LineChart
              data={data}
              xKey="date"
              lines={[
                { key: 'totalTokens', color: 'hsl(38, 80%, 50%)', name: 'Tokens' },
                { key: 'inputTokens', color: 'hsl(220, 80%, 50%)', name: 'Input' },
                { key: 'outputTokens', color: 'hsl(150, 80%, 40%)', name: 'Output' },
              ]}
              height={300}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
