import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart } from '@/components/common/Charts/BarChart';
interface QuickStatsProps {
  stats: any;
  loading: boolean;
}

export function QuickStats({ stats, loading }: QuickStatsProps) {
  const s = stats as any;
  const chartData = s?.orgStats
    ? s.orgStats.map((org: any) => ({
        name: org.name || 'Unknown',
        users: org.userCount || 0,
      }))
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Organization Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-[250px] bg-muted animate-pulse rounded" />
        ) : chartData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No organization data available
          </div>
        ) : (
          <BarChart data={chartData} xKey="name" yKey="users" height={250} />
        )}
      </CardContent>
    </Card>
  );
}
