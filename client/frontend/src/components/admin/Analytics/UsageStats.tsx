import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/common/Charts/LineChart';
import type { UsageStats } from '@/types/analytics.types';

interface UsageStatsProps {
  data: UsageStats[];
  loading: boolean;
}

export function UsageStats({ data, loading }: UsageStatsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Usage Statistics</CardTitle>
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
              { key: 'chats', color: 'hsl(38, 80%, 50%)', name: 'Chats' },
              { key: 'messages', color: 'hsl(220, 80%, 50%)', name: 'Messages' },
              { key: 'aiMessages', color: 'hsl(150, 80%, 40%)', name: 'AI Messages' },
            ]}
            height={300}
          />
        )}
      </CardContent>
    </Card>
  );
}
