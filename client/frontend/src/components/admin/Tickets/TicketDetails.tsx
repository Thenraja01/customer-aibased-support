import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/UI/StatusBadge';
import { formatDateTime } from '@/utils/formatters';
import { User, Calendar, Tag } from 'lucide-react';

interface TicketDetailsProps {
  ticket: any;
}

export function TicketDetails({ ticket }: TicketDetailsProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold">{ticket.title}</h2>
          <p className="text-sm text-muted-foreground mt-1">ID: {ticket._id}</p>
        </div>
        <StatusBadge status={ticket.status} />
      </div>

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Description</h3>
            <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="flex items-center gap-2 text-sm">
              <Tag size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Priority:</span>
              <span className="font-medium capitalize">{ticket.priority}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <User size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium capitalize">{ticket.status}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Calendar size={14} className="text-muted-foreground" />
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{formatDateTime(ticket.created_at)}</span>
            </div>
            {ticket.assigned_to && (
              <div className="flex items-center gap-2 text-sm">
                <User size={14} className="text-muted-foreground" />
                <span className="text-muted-foreground">Assigned to:</span>
                <span className="font-medium">
                  {typeof ticket.assigned_to === 'object' ? ticket.assigned_to.name : ticket.assigned_to}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
