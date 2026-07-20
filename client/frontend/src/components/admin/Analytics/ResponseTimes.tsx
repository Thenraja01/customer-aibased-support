import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart } from '@/components/common/Charts/LineChart';
import type { ResponseTimeStats } from '@/types/analytics.types';

interface ResponseTimesProps {
  data: ResponseTimeStats[];
  loading: boolean;
}

export function ResponseTimes({ data, loading }: ResponseTimesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Response Times</CardTitle>
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
              { key: 'avgResponseTime', color: 'hsl(38, 80%, 50%)', name: 'Avg Response' },
              { key: 'avgResolutionTime', color: 'hsl(150, 80%, 40%)', name: 'Avg Resolution' },
            ]}
            height={300}
          />
        )}
      </CardContent>
    </Card>
  );
}
