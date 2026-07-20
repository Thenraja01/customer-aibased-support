import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { TicketDetails } from '@/components/admin/Tickets/TicketDetails';
import { TicketEscalation } from '@/components/support/Tickets/TicketEscalation';
import { Skeleton } from '@/components/ui/skeleton';

export default function SupportTicketDetailsPage() {
  const { id } = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTicket();
  }, [id]);

  const loadTicket = async () => {
    try {
      const { TicketAPI } = await import('@/api/ticket.api');
      const res = await TicketAPI.getById(id!);
      setTicket(res.data.data);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  const handleEscalate = async (ticketId: string, reason: string) => {
    try {
      const { TicketAPI } = await import('@/api/ticket.api');
      await TicketAPI.escalate(ticketId, reason);
    } catch {
      // handled
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!ticket) {
    return <div className="text-center py-12 text-muted-foreground">Ticket not found</div>;
  }

  return (
    <div className="space-y-6">
      <TicketDetails ticket={ticket} />
      <TicketEscalation ticketId={ticket._id} onEscalate={handleEscalate} />
    </div>
  );
}
