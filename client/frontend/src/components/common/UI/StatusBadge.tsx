import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const colorMap: Record<string, string> = {
  active: 'bg-green-500/10 text-green-600',
  inactive: 'bg-gray-500/10 text-gray-600',
  blocked: 'bg-red-500/10 text-red-600',
  pending: 'bg-yellow-500/10 text-yellow-600',
  approved: 'bg-green-500/10 text-green-600',
  rejected: 'bg-red-500/10 text-red-600',
  open: 'bg-blue-500/10 text-blue-600',
  in_progress: 'bg-yellow-500/10 text-yellow-600',
  resolved: 'bg-green-500/10 text-green-600',
  closed: 'bg-gray-500/10 text-gray-600',
  urgent: 'bg-red-500/10 text-red-600',
  high: 'bg-orange-500/10 text-orange-600',
  medium: 'bg-yellow-500/10 text-yellow-600',
  low: 'bg-green-500/10 text-green-600',
  unread: 'bg-primary/10 text-primary',
  read: 'bg-muted text-muted-foreground',
  escalated: 'bg-purple-500/10 text-purple-600',
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClass = colorMap[status] || 'bg-muted text-muted-foreground';

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize',
        colorClass,
        className
      )}
    >
      {status.replace(/_/g, ' ')}
    </span>
  );
}
