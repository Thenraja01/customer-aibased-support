import { useState, useEffect } from 'react';
import { MetricCard } from '@/components/common/Charts/MetricCard';
import { MessageCircle, Ticket, FileText, Bell } from 'lucide-react';

export function DashboardStats() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const { TicketAPI } = await import('@/api/ticket.api');
      const { ChatAPI } = await import('@/api/chat.api');
      const { default: DocumentAPI } = await import('@/api/document.api');
      const [ticketsRes, chatsRes, docsRes] = await Promise.all([
        TicketAPI.getStats(),
        ChatAPI.getAll({ limit: 1 }),
        DocumentAPI.getAll({ limit: 1 }),
      ]);
      setStats({
        tickets: ticketsRes.data.data?.total || 0,
        openTickets: ticketsRes.data.data?.open || 0,
        chats: chatsRes.data.pagination?.total || 0,
        documents: docsRes.data.pagination?.total || 0,
      });
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Active Chats"
        value={stats?.chats || 0}
        icon={<MessageCircle size={18} />}
        loading={loading}
      />
      <MetricCard
        title="Open Tickets"
        value={stats?.openTickets || 0}
        icon={<Ticket size={18} />}
        loading={loading}
      />
      <MetricCard
        title="Documents"
        value={stats?.documents || 0}
        icon={<FileText size={18} />}
        loading={loading}
      />
      <MetricCard
        title="Notifications"
        value={stats?.tickets || 0}
        icon={<Bell size={18} />}
        loading={loading}
      />
    </div>
  );
}
