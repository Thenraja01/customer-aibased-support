import { PieChart } from './PieChart';

interface DoughnutChartProps {
  data: { name: string; value: number; color: string }[];
  height?: number;
}

export function DoughnutChart({ data, height = 300 }: DoughnutChartProps) {
  return <PieChart data={data} height={height} innerRadius={60} outerRadius={100} />;
}
