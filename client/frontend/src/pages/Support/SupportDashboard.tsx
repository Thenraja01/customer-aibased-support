import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { TicketAPI } from "@/api";
import { Clock, CheckCircle2, ArrowRight, ListOrdered, AlertCircle, Ticket, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
          accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
        />
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
