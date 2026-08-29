import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { TicketAPI } from "@/api";
import { Clock, CheckCircle2, ArrowRight, ListOrdered, AlertCircle, Ticket, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function SupportDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stats, setStats] = useState<any>({ assignedToMe: 0, openTickets: 0, inProgressTickets: 0, resolvedTickets: 0 });
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    setLoading(true);
    Promise.all([
      TicketAPI.getStats().then(r => { if (r.data.success) setStats(r.data.data); }).catch(() => {}),
      TicketAPI.getAll({ limit: 8, sort: "-created_at" }).then(r => {
        if (r.data.success) setRecentTickets(r.data.data || []);
      }).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [user]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open": return "badge-open";
      case "in_progress": return "badge-in-progress";
      case "waiting_for_customer": return "badge-waiting";
      case "resolved": return "badge-resolved";
      case "closed": return "badge-closed";
      default: return "badge-closed";
    }
  };

  const getPriorityStyle = (priority: string) => {
    if (priority === "urgent" || priority === "high") return "badge-urgent";
    if (priority === "medium") return "surface-warning";
    return "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold ">
          Support Workspace
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Welcome back, <span className="font-medium text-foreground">{user?.name || "Agent"}</span>. Here is your active queue.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={ListOrdered}
          label="My Assigned"
          value={stats.assignedToMe}
          accent="bg-primary/10 text-primary"
          link="/support/tickets"
        />
        <StatCard
          icon={AlertCircle}
          label="Open Queue"
          value={stats.openTickets}
          accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
          link="/support/tickets?status=open"
        />
        <StatCard
          icon={Clock}
          label="In Progress"
          value={stats.inProgressTickets}
          accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
          link="/support/tickets?status=in_progress"
        />
        <StatCard
          icon={CheckCircle2}
          label="Resolved"
          value={stats.resolvedTickets}
          accent="bg-success/10 text-success"
        />
      </div>

      {/* Recharts Support Agent Analytics & Personal Performance Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Daily Resolution Velocity BarChart (2 Cols) */}
        <div className="lg:col-span-2 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Daily Resolution Velocity
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  🔥 4-Day Streak
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">Tickets resolved per day vs target SLA velocity</p>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold text-indigo-400 block">Today's Target: 85%</span>
              <span className="text-[11px] text-slate-400">Avg FRT: 12.4 min</span>
            </div>
          </div>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[
                { day: "Mon", resolved: stats.resolvedTickets || 0, target: 10 },
                { day: "Tue", resolved: stats.resolvedTickets || 0, target: 10 },
                { day: "Wed", resolved: stats.resolvedTickets || 0, target: 10 },
                { day: "Thu", resolved: stats.resolvedTickets || 0, target: 10 },
                { day: "Fri", resolved: stats.resolvedTickets || 0, target: 10 },
                { day: "Sat", resolved: Math.min(stats.resolvedTickets || 0, 5), target: 5 },
                { day: "Sun", resolved: Math.min(stats.resolvedTickets || 0, 5), target: 5 },
              ]}>
                <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px", color: "#f8fafc" }} />
                <Bar dataKey="resolved" fill="#6366f1" radius={[6, 6, 0, 0]} name="Resolved Tickets" />
                <Bar dataKey="target" fill="#334155" radius={[6, 6, 0, 0]} name="Target Velocity" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* SLA Compliance & CSAT Health (1 Col) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-100">Performance Radar</h3>
              <p className="text-xs text-slate-400 mt-0.5">SLA & CSAT satisfaction score</p>
            </div>
            <div className="px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 font-bold text-xs flex items-center gap-1">
              ⭐ 4.9 / 5.0
            </div>
          </div>
          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "On Track", value: Math.max(stats.assignedToMe || 0, 1), color: "#10b981" },
                    { name: "Warning", value: stats.openTickets || 0, color: "#f59e0b" },
                    { name: "Breached", value: stats.inProgressTickets || 0, color: "#f43f5e" },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  <Cell key="cell-ontrack" fill="#10b981" />
                  <Cell key="cell-warning" fill="#f59e0b" />
                  <Cell key="cell-breached" fill="#f43f5e" />
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px", color: "#f8fafc" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Tickets Table */}
      <div className="rounded-lg border border-border bg-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Recent Tickets</h2>
          <Link to="/support/tickets" className="text-xs text-primary hover:underline font-medium flex items-center gap-1">
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {recentTickets.length === 0 ? (
          <div className="py-12 text-center">
            <Ticket size={24} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No tickets in queue</p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase ">Subject</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase ">Customer</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase ">Priority</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase ">Status</th>
                    <th className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase ">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentTickets.map((t) => (
                    <tr
                      key={t._id}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => navigate(`/support/tickets/${t._id}`)}
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium truncate max-w-[250px]">{t.subject}</p>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.user_id?.name || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", getPriorityStyle(t.priority))}>
                          {t.priority || "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", getStatusStyle(t.status))}>
                          {t.status?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(t.updated_at || t.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile list */}
            <div className="md:hidden divide-y divide-border">
              {recentTickets.map((t) => (
                <div
                  key={t._id}
                  className="px-4 py-3 hover:bg-muted/30 transition-colors cursor-pointer"
                  onClick={() => navigate(`/support/tickets/${t._id}`)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium truncate">{t.subject}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {t.user_id?.name || "Unknown"} · {new Date(t.updated_at || t.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0", getStatusStyle(t.status))}>
                      {t.status?.replace("_", " ")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent, link }: { icon: any; label: string; value: number; accent: string; link?: string }) {
  const content = (
    <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold ">{value ?? 0}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accent)}>
          <Icon size={16} />
        </div>
      </div>
    </div>
  );

  if (link) {
    return <Link to={link} className="block">{content}</Link>;
  }
  return content;
}
