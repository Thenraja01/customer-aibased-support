import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DoughnutChart } from '@/components/common/Charts/DoughnutChart';

interface SupportStatsProps {
  stats: any;
  loading: boolean;
}

export function SupportStats({ stats, loading }: SupportStatsProps) {
  const chartData = [
    { name: 'Open', value: stats?.open || 0, color: 'hsl(38, 80%, 50%)' },
    { name: 'In Progress', value: stats?.in_progress || 0, color: 'hsl(220, 80%, 50%)' },
    { name: 'Resolved', value: stats?.resolved || 0, color: 'hsl(150, 80%, 40%)' },
    { name: 'Closed', value: stats?.closed || 0, color: 'hsl(0, 0%, 60%)' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Ticket Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] bg-muted animate-pulse rounded" />
        ) : (
          <DoughnutChart data={chartData} height={250} />
        )}
      </CardContent>
    </Card>
  );
}
