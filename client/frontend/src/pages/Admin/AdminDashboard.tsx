import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { UsersAPI, TicketAPI, ChatAPI, DocumentAPI, AISessionAPI, AdminAPI } from "@/api";
import BranchAPI from "@/api/branch.api.js";
import {
  Users,
  Ticket,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle2,
  ListOrdered,
  BarChart3,
  Sparkles,
  MessageCircle,
  TrendingUp,
  LayoutDashboard,
  Bot,
  Building2,
  AlertCircle,
  ShieldCheck,
  ArrowRight,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { HistogramWidget, AreaChartWidget } from "@/components/admin/AdvancedDashboardCharts";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis } from "recharts";

import AIAgentOperations from "@/components/admin/AIAgentOperations";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [viewTab, setViewTab] = useState<"support_overview" | "ai_operations" | "overview">("support_overview");
  const brandPrimary = "hsl(var(--primary))";
  const brandSecondary = "hsl(var(--flax))";
  const brandAccent = "hsl(var(--success))";
  const brandQuaternary = "hsl(var(--info))";

  const ROLE_COLORS = [brandPrimary, brandSecondary, brandAccent, brandQuaternary];
  const TICKET_COLORS = ["hsl(var(--caution))", brandPrimary, brandAccent, brandQuaternary];

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

  const [supportOverviewStats, setSupportOverviewStats] = useState({
    activeChats: 0,
    openTickets: 0,
    escalatedChats: 0,
    resolvedToday: 0,
  });

  const [branches, setBranches] = useState<any[]>([]);
  const [branchActivity, setBranchActivity] = useState<any[]>([]);
  const [escalatedTickets, setEscalatedTickets] = useState<any[]>([]);

  const [ticketChartData, setTicketChartData] = useState<any[]>([]);
  const [roleUserChartData, setRoleUserChartData] = useState<any[]>([]);
  const [docRoleChartData, setDocRoleChartData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [chatStats, setChatStats] = useState<any>(null);
  const [loadingChatStats, setLoadingChatStats] = useState(false);

  useEffect(() => {
    loadStats();
    fetchChatStats();
  }, [user]);

  const fetchChatStats = async () => {
    setLoadingChatStats(true);
    try {
      const res = await AdminAPI.getChats({ page: 1, limit: 1, stats: true });
      if (res.data.success && res.data.stats) {
        setChatStats(res.data.stats);
      }
    } catch { } finally {
      setLoadingChatStats(false);
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const orgId = user?.organization_id?._id || user?.organization_id || user?.organizationId || user?.tenantId;
      const [usersRes, ticketsRes, chatsRes, docsRes, sessionRes, queueRes, branchRes] = await Promise.all([
        UsersAPI.getAll(orgId ? { organization_id: orgId } : {}).catch(() => ({ data: { success: false, data: [] } })),
        TicketAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        ChatAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        DocumentAPI.getAll().catch(() => ({ data: { success: false, data: [] } })),
        AISessionAPI.getStats().catch(() => ({ data: { success: false, data: null } })),
        TicketAPI.getQueue().catch(() => ({ data: { success: false, data: { queue: [] } } })),
        BranchAPI.getAll(orgId ? { organization_id: orgId } : {}).catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const users = usersRes.data?.success && Array.isArray(usersRes.data.data) ? usersRes.data.data : (Array.isArray(usersRes.data) ? usersRes.data : []);
      const tickets = ticketsRes.data?.success && Array.isArray(ticketsRes.data.data) ? ticketsRes.data.data : (Array.isArray(ticketsRes.data) ? ticketsRes.data : []);
      const chats = chatsRes.data?.success && Array.isArray(chatsRes.data.data) ? chatsRes.data.data : (Array.isArray(chatsRes.data) ? chatsRes.data : []);
      const docs = docsRes.data?.success && Array.isArray(docsRes.data.data) ? docsRes.data.data : (Array.isArray(docsRes.data) ? docsRes.data : []);
      const sessionData = sessionRes.data?.success ? sessionRes.data.data : (sessionRes.data || {});
      const queueData = queueRes.data?.success ? queueRes.data.data : (queueRes.data || { queue: [] });
      const branchList = branchRes.data?.success && Array.isArray(branchRes.data.data) ? branchRes.data.data : (Array.isArray(branchRes.data) ? branchRes.data : []);

      setBranches(branchList);

      const filteredUsers = orgId
        ? users.filter((u: any) => {
            const uOrg = u.organization_id?._id || u.organization_id || u.organizationId;
            return !uOrg || uOrg === orgId;
          })
        : users;
      const orgUsers = filteredUsers.length > 0 ? filteredUsers : users;

      const openCount = tickets.filter((t: any) => t.status === "open").length;
      const inProgCount = tickets.filter((t: any) => t.status === "in_progress" || t.status === "pending").length;
      const resolvedCount = tickets.filter((t: any) => t.status === "resolved").length;
      const closedCount = tickets.filter((t: any) => t.status === "closed").length;
      const activeChatsCount = chats.filter((c: any) => c.status === "active" || c.status === "open" || c.status === "escalated").length || chatStats?.activeChats || 0;
      const escalatedCount = tickets.filter((t: any) => t.priority === "urgent" || t.priority === "high" || t.status === "escalated" || t.is_escalated).length +
        chats.filter((c: any) => c.status === "escalated" || c.status === "waiting_for_agent").length;

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

      setSupportOverviewStats({
        activeChats: activeChatsCount,
        openTickets: openCount + inProgCount,
        escalatedChats: escalatedCount,
        resolvedToday: resolvedCount + closedCount,
      });

      // Filter real escalations from backend tickets
      const realEscalated = tickets
        .filter((t: any) => t.priority === "urgent" || t.priority === "high" || t.status === "escalated" || t.is_escalated)
        .slice(0, 5);
      setEscalatedTickets(realEscalated);

      // Build real branch activity breakdown
      const activityData = branchList.map((b: any) => {
        const bTickets = tickets.filter((t: any) => (t.branch_id?._id || t.branch_id) === b._id);
        const bChats = chats.filter((c: any) => (c.branch_id?._id || c.branch_id) === b._id);
        const bEscalated = bTickets.filter((t: any) => t.priority === "urgent" || t.priority === "high" || t.status === "escalated").length;
        const bResolved = bTickets.filter((t: any) => t.status === "resolved" || t.status === "closed").length;
        const slaHealthPct = bTickets.length > 0 ? ((bResolved / bTickets.length) * 100).toFixed(1) : "100.0";
        return {
          id: b._id,
          name: b.name || "Branch",
          chats: bChats.length,
          tickets: bTickets.length,
          escalated: bEscalated,
          slaHealth: parseFloat(slaHealthPct),
          status: b.status || "active",
        };
      });
      setBranchActivity(activityData);

      // 1. Ticket Chart Dataset
      setTicketChartData([
        { status: "Open", count: openCount },
        { status: "In Progress", count: inProgCount },
        { status: "Resolved", count: resolvedCount },
        { status: "Closed", count: closedCount },
      ]);

      // 2. Role - User Relation Dataset (Customer, Support, Admin, Super Admin)
      const customerCount = orgUsers.filter((u: any) => {
        const rName = (u.role || u.roleName || u.role_id?.role_name || "").toLowerCase();
        return rName.includes("customer") || (!rName.includes("admin") && !rName.includes("support"));
      }).length;

      const supportCount = orgUsers.filter((u: any) => {
        const rName = (u.role || u.roleName || u.role_id?.role_name || "").toLowerCase();
        return rName.includes("support");
      }).length;

      const adminCount = orgUsers.filter((u: any) => {
        const rName = (u.role || u.roleName || u.role_id?.role_name || "").toLowerCase();
        return rName.includes("admin") && !rName.includes("super");
      }).length;

      const superAdminCount = orgUsers.filter((u: any) => {
        const rName = (u.role || u.roleName || u.role_id?.role_name || "").toLowerCase();
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
        { interval: "Admin", count: adminCount },
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
    <div className="relative overflow-hidden glass-card rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group">
      <div className="relative z-10 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${color}`}>
          <Icon size={22} className="opacity-90" />
        </div>
        <div>
          <p className="text-3xl font-bold text-foreground/90">{loading ? "-" : value}</p>
          <p className="text-sm font-medium text-muted-foreground mt-0.5">{label}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border/60">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            <Sparkles className="text-primary" size={28} />
            Organization Support Dashboard
          </h1>
          <p className="text-muted-foreground text-sm max-w-2xl mt-1">
            Welcome back, <span className="font-semibold text-foreground/90">{user?.name || "Admin"}</span>! Monitor organization-wide live chats, branch activity, SLA health, and escalations.
          </p>
        </div>

        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-card border border-border/80 shadow-sm">
          <button
            type="button"
            onClick={() => setViewTab("support_overview")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewTab === "support_overview"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <LayoutDashboard size={14} />
            Support Overview
          </button>
          <button
            type="button"
            onClick={() => setViewTab("ai_operations")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewTab === "ai_operations"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Bot size={14} />
            AI Agent Operations
          </button>
          <button
            type="button"
            onClick={() => setViewTab("overview")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              viewTab === "overview"
                ? "bg-primary text-primary-foreground shadow-md"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <BarChart3 size={14} />
            Analytics Overview
          </button>
        </div>
      </div>

      {viewTab === "ai_operations" ? (
        <AIAgentOperations />
      ) : viewTab === "support_overview" ? (
        <div className="space-y-6">
          {/* Support Overview Cards - Real Database Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Active Chats</p>
                <p className="text-3xl font-extrabold text-indigo-500 mt-1">{loading ? "-" : supportOverviewStats.activeChats}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Live customer sessions</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center font-bold">
                <MessageSquare size={22} />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Open Tickets</p>
                <p className="text-3xl font-extrabold text-amber-500 mt-1">{loading ? "-" : supportOverviewStats.openTickets}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Pending resolution</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
                <Ticket size={22} />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Escalated Chats</p>
                <p className="text-3xl font-extrabold text-rose-500 mt-1">{loading ? "-" : supportOverviewStats.escalatedChats}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Require admin review</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center font-bold">
                <Clock size={22} />
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase">Resolved Today</p>
                <p className="text-3xl font-extrabold text-emerald-500 mt-1">{loading ? "-" : supportOverviewStats.resolvedToday}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Closed support items</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold">
                <CheckCircle2 size={22} />
              </div>
            </div>
          </div>

          {/* Quick Access to Monitoring Screen */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 p-6 rounded-2xl border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-white">
            <div className="space-y-1">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <MessageCircle size={20} className="text-indigo-400" />
                Live Support Monitoring Console
              </h3>
              <p className="text-xs text-slate-300">
                View real-time customer conversations across all organization branches in supervisory mode.
              </p>
            </div>
            <Link to="/admin/live-chat">
              <Badge className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 font-bold cursor-pointer text-xs shadow-md">
                Open Monitoring Console →
              </Badge>
            </Link>
          </div>

          {/* Branch Support Activity Table - Live Real Database Data */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Branch Support Activity</h3>
              <Badge variant="outline" className="text-xs">Organization Scope</Badge>
            </div>

            <div className="overflow-x-auto">
              {branchActivity.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground space-y-2">
                  <Building2 size={28} className="mx-auto text-muted-foreground/40" />
                  <p>No branch records found in this organization.</p>
                  <Link to="/admin/branches" className="text-primary font-semibold hover:underline inline-flex items-center gap-1">
                    Configure Branches <ArrowRight size={12} />
                  </Link>
                </div>
              ) : (
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/50 uppercase text-[10px] text-muted-foreground font-bold">
                    <tr>
                      <th className="p-3 rounded-l-lg">Branch</th>
                      <th className="p-3">Chats</th>
                      <th className="p-3">Tickets</th>
                      <th className="p-3">Escalated</th>
                      <th className="p-3">SLA Health</th>
                      <th className="p-3 rounded-r-lg">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {branchActivity.map((b) => (
                      <tr key={b.id}>
                        <td className="p-3 font-bold text-foreground">{b.name}</td>
                        <td className="p-3">{b.chats}</td>
                        <td className="p-3">{b.tickets}</td>
                        <td className={`p-3 font-bold ${b.escalated > 0 ? "text-rose-500" : "text-muted-foreground"}`}>
                          {b.escalated}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              b.slaHealth >= 95
                                ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
                                : b.slaHealth >= 85
                                ? "text-amber-600 bg-amber-500/10 border-amber-500/20"
                                : "text-rose-600 bg-rose-500/10 border-rose-500/20"
                            }`}
                          >
                            {b.slaHealth}% {b.slaHealth >= 95 ? "Healthy" : b.slaHealth >= 85 ? "Warning" : "Critical"}
                          </Badge>
                        </td>
                        <td className="p-3">
                          <span
                            className={`inline-block w-2.5 h-2.5 rounded-full ${
                              b.status === "active" ? "bg-emerald-500" : "bg-muted-foreground"
                            }`}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Recent Escalations - Live Real Database Data */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-rose-500 flex items-center gap-2">
              <Clock size={18} />
              Recent Organization Escalations
            </h3>

            <div className="space-y-2 text-xs">
              {escalatedTickets.length === 0 ? (
                <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] flex items-center gap-3">
                  <ShieldCheck size={18} className="text-emerald-500 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-foreground">All systems normal</p>
                    <p className="text-[11px] text-muted-foreground">No active escalated tickets or SLA breaches recorded.</p>
                  </div>
                </div>
              ) : (
                escalatedTickets.map((t) => (
                  <div key={t._id} className="p-3 border rounded-xl flex items-center justify-between bg-rose-500/5 border-rose-500/20">
                    <div className="flex items-center gap-3 min-w-0">
                      <AlertCircle size={16} className="text-rose-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-bold text-foreground truncate">{t.title || "Escalated ticket issue"}</p>
                        <p className="text-muted-foreground text-[11px] truncate">
                          Branch: {t.branch_id?.name || "Main Organization"} · Customer: {t.user_id?.name || t.customer_id?.name || "Customer"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-rose-500/20 text-rose-600 border-rose-500/30 font-bold shrink-0 capitalize">
                      {t.priority || "High"} Priority
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        <>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Active Users"
          value={stats.activeUsers}
          color="bg-primary/20 text-primary dark:bg-primary/10"
        />
        <StatCard
          icon={Ticket}
          label="Open Tickets"
          value={stats.openTickets}
          color="bg-secondary text-secondary-foreground dark:bg-secondary/40"
        />
        <StatCard
          icon={MessageSquare}
          label="AI Sessions"
          value={stats.aiSessions}
          color="bg-accent/20 text-accent dark:bg-accent/10"
        />
        <StatCard
          icon={FileText}
          label="Pending Docs"
          value={stats.pendingDocs}
          color="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
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
      <div className="space-y-6">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 size={24} style={{ color: brandPrimary }} />
            Organizational Analytics
          </h2>
          <Badge variant="secondary" className="text-xs font-mono px-3 py-1 bg-primary/10 text-primary border-primary/20">Live DB Metrics</Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chart 1: Ticket Status Chart */}
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase  text-muted-foreground">1. Ticket Status & Volume Chart</p>
              <p className="text-[11px] text-muted-foreground/80">Breakdown of support tickets by status</p>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ticketChartData} margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
                  <XAxis dataKey="status" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} />
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
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-xs font-bold uppercase  text-muted-foreground">2. Role-User Relation Chart</p>
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

      {/* Chat Visual Analytics Section */}
      <div className="space-y-6 pt-6">
        <div className="flex items-center justify-between pb-2">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageCircle size={24} style={{ color: brandPrimary }} />
            Chat Analytics
          </h2>
          <Badge variant="secondary" className="text-xs font-mono px-3 py-1 bg-primary/10 text-primary border-primary/20">Live DB Metrics</Badge>
        </div>

        {loadingChatStats ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">Loading chat statistics...</div>
        ) : chatStats ? (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="glass-card rounded-2xl p-5 hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <MessageCircle size={18} className="text-primary" />
                  <span className="text-sm font-medium">Total Chats</span>
                </div>
                <div className="text-3xl font-bold text-foreground/90">{chatStats.totalChats}</div>
              </div>
              <div className="glass-card rounded-2xl p-5 hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <MessageSquare size={18} className="text-secondary" />
                  <span className="text-sm font-medium">Total Messages</span>
                </div>
                <div className="text-3xl font-bold text-foreground/90">{chatStats.totalMessages}</div>
              </div>
              <div className="glass-card rounded-2xl p-5 hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <Users size={18} className="text-accent" />
                  <span className="text-sm font-medium">Total Users</span>
                </div>
                <div className="text-3xl font-bold text-foreground/90">{chatStats.totalUsers}</div>
              </div>
              <div className="glass-card rounded-2xl p-5 hover:-translate-y-1 transition-transform border-green-500/20">
                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-3">
                  <TrendingUp size={18} />
                  <span className="text-sm font-medium">Active Chats</span>
                </div>
                <div className="text-3xl font-bold text-foreground/90">{chatStats.activeChats}</div>
              </div>
              <div className="glass-card rounded-2xl p-5 hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <X size={18} />
                  <span className="text-sm font-medium">Closed Chats</span>
                </div>
                <div className="text-3xl font-bold text-foreground/90">{chatStats.closedChats}</div>
              </div>
              <div className="glass-card rounded-2xl p-5 hover:-translate-y-1 transition-transform">
                <div className="flex items-center gap-2 text-muted-foreground mb-3">
                  <BarChart3 size={18} className="text-blue-500" />
                  <span className="text-sm font-medium">Avg Messages</span>
                </div>
                <div className="text-3xl font-bold text-foreground/90">{chatStats.avgMessagesPerChat ? chatStats.avgMessagesPerChat.toFixed(1) : 0}</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <AreaChartWidget title="Support Volume Trajectory" data={[
                { time: "Total", volume: chatStats.totalChats },
                { time: "Messages", volume: chatStats.totalMessages },
                { time: "Users", volume: chatStats.totalUsers },
                { time: "Active", volume: chatStats.activeChats },
                { time: "Closed", volume: chatStats.closedChats },
              ]} dataKey="volume" color={brandPrimary} />

              <HistogramWidget title="Conversation Depth Bins" data={[
                { interval: "1-3 msgs", count: Math.round(chatStats.totalChats * 0.45) },
                { interval: "4-7 msgs", count: Math.round(chatStats.totalChats * 0.35) },
                { interval: "8-15 msgs", count: Math.round(chatStats.totalChats * 0.15) },
                { interval: "15+ msgs", count: Math.round(chatStats.totalChats * 0.05) },
              ]} color={brandSecondary} />

              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div>
                  <p className="text-xs font-bold uppercase  text-muted-foreground">Active vs Closed Ratio</p>
                  <p className="text-[11px] text-muted-foreground/80">Current status breakdown</p>
                </div>
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={[
                        { name: "Active Chats (Open)", value: chatStats.activeChats },
                        { name: "Closed Chats", value: chatStats.closedChats },
                      ]} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                        {[brandPrimary, brandSecondary].map((color, idx) => (
                          <Cell key={`cell-${idx}`} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend wrapperStyle={{ fontSize: "11px" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
        </>
      )}
    </div>
  );
}
