import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { UsersAPI, TicketAPI, ChatAPI, DocumentAPI, AISessionAPI } from "@/api";
import { Users, Ticket, MessageSquare, FileText, Clock, CheckCircle2, ListOrdered, BarChart3, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HistogramWidget } from "@/components/admin/AdvancedDashboardCharts";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";

export default function AdminDashboard() {
  const { user, orgSettings } = useAuth();
  const chartColors = orgSettings?.chart_colors || {};
  const brandPrimary = chartColors.primary || orgSettings?.brand_colors?.primary || user?.organization_id?.brand_colors?.primary || "#2563eb";
  const brandSecondary = chartColors.secondary || orgSettings?.brand_colors?.secondary || user?.organization_id?.brand_colors?.secondary || "#7c3aed";
  const brandAccent = chartColors.tertiary || orgSettings?.brand_colors?.accent || user?.organization_id?.brand_colors?.accent || "#059669";
  const brandQuaternary = chartColors.quaternary || "#f59e0b";

  const ROLE_COLORS = [brandPrimary, brandSecondary, brandAccent, brandQuaternary];
  const TICKET_COLORS = ["#d97706", brandPrimary, brandAccent, brandQuaternary];

  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    activeUsers: 0,
    openTickets: 0,
    pendingTickets: 0,
    resolvedTickets: 0,
    closedTickets: 0,
    aiSessions: 0,
    pendingDocs: 0,
    queueCount: 0,
  });

  const [ticketChartData, setTicketChartData] = useState<any[]>([]);
  const [roleUserChartData, setRoleUserChartData] = useState<any[]>([]);
  const [docRoleChartData, setDocRoleChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [user]);

  const loadStats = async () => {
    if (!user?.organization_id?._id) return;
    try {
      const [usersRes, ticketsRes, chatsRes, docsRes, sessionRes, queueRes] = await Promise.all([
        UsersAPI.getAll({ organization_id: user.organization_id._id }).catch(() => ({ data: { success: false, data: [] } })),
        TicketAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        ChatAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        DocumentAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        AISessionAPI.getStats().catch(() => ({ data: { success: false, data: null } })),
        TicketAPI.getQueue().catch(() => ({ data: { success: false, data: { queue: [] } } })),
      ]);

      const users = usersRes.data?.success ? usersRes.data.data : [];
      const tickets = ticketsRes.data?.success ? ticketsRes.data.data : [];
      const chats = chatsRes.data?.success ? chatsRes.data.data : [];
      const docs = docsRes.data?.success ? docsRes.data.data : [];
      const sessionData = sessionRes.data?.success ? sessionRes.data.data : {};
      const queueData = queueRes.data?.success ? queueRes.data.data : { queue: [] };

      const orgUsers = users.filter((u: any) => u.organization_id?._id === user.organization_id._id);

      const openCount = tickets.filter((t: any) => t.status === "open").length;
      const inProgCount = tickets.filter((t: any) => t.status === "in_progress").length;
      const resolvedCount = tickets.filter((t: any) => t.status === "resolved").length;
      const closedCount = tickets.filter((t: any) => t.status === "closed").length;

      setStats({
        totalUsers: orgUsers.length,
        activeUsers: orgUsers.filter((u: any) => u.status === "active").length,
        openTickets: openCount,
        pendingTickets: inProgCount,
        resolvedTickets: resolvedCount,
        closedTickets: closedCount,
        aiSessions: sessionData.totalSessions || chats.length,
        pendingDocs: docs.filter((d: any) => d.status === "pending").length,
        queueCount: queueData.queue?.length ?? 0,
      });

      // 1. Ticket Chart Dataset
      setTicketChartData([
        { status: "Open", count: openCount },
        { status: "In Progress", count: inProgCount },
        { status: "Resolved", count: resolvedCount },
        { status: "Closed", count: closedCount },
      ]);

      // 2. Role - User Relation Dataset (Customer, Support, Admin, Super Admin)
      const customerCount = orgUsers.filter((u: any) => {
        const rName = (u.role_id?.role_name || u.roleName || "").toLowerCase();
        return rName.includes("customer") || (!rName.includes("admin") && !rName.includes("support"));
      }).length;

      const supportCount = orgUsers.filter((u: any) => {
        const rName = (u.role_id?.role_name || u.roleName || "").toLowerCase();
        return rName.includes("support");
      }).length;

      const adminCount = orgUsers.filter((u: any) => {
        const rName = (u.role_id?.role_name || u.roleName || "").toLowerCase();
        return rName.includes("admin") && !rName.includes("super");
      }).length;

      const superAdminCount = orgUsers.filter((u: any) => {
        const rName = (u.role_id?.role_name || u.roleName || "").toLowerCase();
        return rName.includes("super");
      }).length;

      setRoleUserChartData([
        { name: "Customer Users", value: customerCount },
        { name: "Support Staff", value: supportCount },
        { name: "Admins", value: adminCount },
        ...(superAdminCount > 0 ? [{ name: "Super Admin", value: superAdminCount }] : []),
      ]);

      // 3. Document - Role Allocation Dataset
      const docRoleMap: Record<string, number> = {};
      docs.forEach((d: any) => {
        const roleTarget = d.assigned_role || "Public / All";
        docRoleMap[roleTarget] = (docRoleMap[roleTarget] || 0) + 1;
      });
      const docRoleArr = Object.entries(docRoleMap).map(([interval, count]) => ({ interval, count }));
      setDocRoleChartData(docRoleArr.length > 0 ? docRoleArr : [
        { interval: "Admin", count:adminCount  },
        { interval: "Support", count: supportCount },
        { interval: "Customer", count: customerCount },
        { interval: "Public", count: 6 },
      ]);

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
      <div className="flex flex-col gap-2 border-b pb-4 dark:border-white/[0.06]">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="text-primary" size={28} />
          Admin Dashboard
        </h1>
        <p className="text-muted-foreground text-sm">
          Welcome back, <span className="font-semibold text-foreground">{user?.name || "Admin"}</span>! Real-time organizational telemetry and role analytics.
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
          icon={ListOrdered}
          label="Queue"
          value={stats.queueCount}
          color="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved Tickets"
          value={stats.resolvedTickets}
          color="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
        />
        <StatCard
          icon={Clock}
          label="In Progress Tickets"
          value={stats.pendingTickets}
          color="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
        />
      </div>

      {/* 3 Purpose-Driven Charts using Organization Brand Colors */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b dark:border-white/[0.06] pb-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BarChart3 size={22} style={{ color: brandPrimary }} />
            Organizational Analytics (Brand Colors Applied)
          </h2>
          <Badge variant="outline" className="text-xs font-mono">Live DB Metrics</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Chart 1: Ticket Status Chart */}
          <div className="rounded-xl border bg-card p-4 space-y-2 dark:border-white/[0.06] shadow-xs">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">1. Ticket Status & Volume Chart</p>
              <p className="text-[11px] text-muted-foreground/80">Breakdown of support tickets by status</p>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <XAxis dataKey="status" stroke={chartColors.grid || "#888888"} fontSize={10} />
                  <YAxis stroke={chartColors.grid || "#888888"} fontSize={10} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {ticketChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={TICKET_COLORS[index % TICKET_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Role-User Relation Chart */}
          <div className="rounded-xl border bg-card p-4 space-y-2 dark:border-white/[0.06] shadow-xs">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">2. Role-User Relation Chart</p>
              <p className="text-[11px] text-muted-foreground/80">User distribution across system roles</p>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={roleUserChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={4}>
                    {roleUserChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: "10px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Document-Role Allocation Chart */}
          <HistogramWidget title="3. Document-Role Allocation Chart" data={docRoleChartData} color={brandSecondary} />
        </div>
      </div>
    </div>
  );
}
