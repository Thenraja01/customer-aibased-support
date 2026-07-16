import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UsersAPI, TicketAPI, ChatAPI, DocumentAPI, AISessionAPI } from "@/api";
import { Users, Ticket, MessageSquare, FileText, Clock, CheckCircle2 } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    openTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    aiSessions: 0,
    pendingDocs: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user?.organization_id?._id) return;
    try {
      const [usersRes, ticketsRes, chatsRes, docsRes, sessionRes] = await Promise.all([
        UsersAPI.getAll({ organization_id: user.organization_id._id }).catch(() => ({ data: { success: false, data: [] } })),
        TicketAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        ChatAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        DocumentAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        AISessionAPI.getStats().catch(() => ({ data: { success: false, data: null } })),
      ]);

      const users = usersRes.data.success ? usersRes.data.data : [];
      const tickets = ticketsRes.data.success ? ticketsRes.data.data : [];
      const chats = chatsRes.data.success ? chatsRes.data.data : [];
      const docs = docsRes.data.success ? docsRes.data.data : [];
      const sessionData = sessionRes.data.success ? sessionRes.data.data : {};

      const orgUsers = users.filter((u: any) => u.organization_id?._id === user.organization_id._id);

      setStats({
        totalUsers: orgUsers.length,
        activeUsers: orgUsers.filter((u: any) => u.status === "active").length,
        openTickets: tickets.filter((t: any) => t.status === "open").length,
        pendingTickets: tickets.filter((t: any) => t.status === "in_progress").length,
        resolvedTickets: tickets.filter((t: any) => t.status === "resolved").length,
        aiSessions: sessionData.totalSessions || chats.length,
        pendingDocs: docs.filter((d: any) => d.status === "pending").length,
      });
    } catch (error) {
      console.error("Failed to load dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-2xl font-bold">{loading ? "-" : value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name || "Admin"}! Here is an overview of your organization.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats.activeUsers}
          color="bg-primary/10 text-primary"
        />
        <StatCard
          icon={Ticket}
          label="Open Tickets"
          value={stats.openTickets}
          color="bg-secondary/10 text-secondary"
        />
        <StatCard
          icon={MessageSquare}
          label="AI Sessions"
          value={stats.aiSessions}
          color="bg-accent text-accent-foreground"
        />
        <StatCard
          icon={FileText}
          label="Pending Docs"
          value={stats.pendingDocs}
          color="bg-primary/10 text-primary"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Clock}
          label="In Progress Tickets"
          value={stats.pendingTickets}
          color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved Tickets"
          value={stats.resolvedTickets}
          color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.totalUsers}
          color="bg-muted text-muted-foreground"
        />
      </div>
    </div>
  );
}
