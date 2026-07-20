import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/UI/StatusBadge';
import { formatRelativeTime } from '@/utils/formatters';
import { ArrowUpDown } from 'lucide-react';

interface SupportTicketTableProps {
  tickets: any[];
  loading: boolean;
}

export function SupportTicketTable({ tickets, loading }: SupportTicketTableProps) {
  const [sortBy, setSortBy] = useState('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  };

  const sorted = [...tickets].sort((a, b) => {
    const valA = a[sortBy] || '';
    const valB = b[sortBy] || '';
    return sortDir === 'asc' ? String(valA).localeCompare(String(valB)) : String(valB).localeCompare(String(valA));
  });

  const priorityColors: Record<string, string> = {
    urgent: 'text-red-500 font-bold',
    high: 'text-orange-500',
    medium: 'text-yellow-500',
    low: 'text-green-500',
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sorted.map((ticket) => (
        <Link key={ticket._id} to={`/support/tickets/${ticket._id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium truncate">{ticket.title}</p>
                    <span className={priorityColors[ticket.priority] || ''}>
                      {ticket.priority}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {ticket.user_id?.name || ticket.user_id} &middot; {formatRelativeTime(ticket.created_at)}
                  </p>
                </div>
                <StatusBadge status={ticket.status} />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
