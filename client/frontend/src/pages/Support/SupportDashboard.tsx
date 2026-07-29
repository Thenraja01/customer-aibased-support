import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Ticket, Clock, CheckCircle2, AlertCircle, HelpCircle, Bell, Users,
  MessageSquare, ArrowRight, Loader2, FileText, RotateCcw, XCircle
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TicketAPI, FAQAPI, UsersAPI } from "@/api";
import { useNotifications } from "@/hooks/useNotifications";
import { useSelector } from "react-redux";
import type { RootState } from "@/store/store";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: "Open", color: "bg-primary/10 text-primary", icon: AlertCircle },
  assigned: { label: "Assigned", color: "bg-blue-500/10 text-blue-600", icon: Users },
  in_progress: { label: "In Progress", color: "bg-accent text-accent-foreground", icon: Clock },
  waiting_for_customer: { label: "Waiting", color: "bg-amber-500/10 text-amber-600", icon: MessageSquare },
  pending: { label: "Pending", color: "bg-purple-500/10 text-purple-600", icon: RotateCcw },
  resolved: { label: "Resolved", color: "bg-green-500/10 text-green-600", icon: CheckCircle2 },
  closed: { label: "Closed", color: "bg-muted text-muted-foreground", icon: XCircle },
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-destructive/10 text-destructive",
  high: "bg-orange-500/10 text-orange-600",
  medium: "bg-primary/10 text-primary",
  low: "bg-muted text-muted-foreground",
};

export default function SupportDashboard() {
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.user);
  const { notifications, unreadCount, loading: notifLoading, loadNotifications, loadUnreadCount, markRead } = useNotifications();

  const [stats, setStats] = useState<any>(null);
  const [recentTickets, setRecentTickets] = useState<any[]>([]);
  const [pendingFaqs, setPendingFaqs] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [faqLoading, setFaqLoading] = useState(true);
  const [customerLoading, setCustomerLoading] = useState(true);

  useEffect(() => {
    if (!user?._id) return;
    loadNotifications();
    loadUnreadCount();

    TicketAPI.getStats().then(r => { if (r.data.success) setStats(r.data.data); }).finally(() => setLoading(false));
    TicketAPI.getAll({ limit: 5, sort: "-created_at" }).then(r => {
      if (r.data.success) setRecentTickets(r.data.data || []);
    });

    FAQAPI.getByStatus("pending").then(r => {
      if (r.data.success) setPendingFaqs(r.data.data || []);
    }).finally(() => setFaqLoading(false));

    UsersAPI.getAll({}).then(r => {
      if (r.data.success) {
        const customers = (r.data.data || []).filter((u: any) =>
          u.role_id?.role_name?.toLowerCase() === "customer"
        );
        setCustomers(customers);
      }
    }).finally(() => setCustomerLoading(false));
  }, [user?._id]);

  const getStatusBadge = (status: string) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.closed;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${cfg.color}`}>{cfg.label}</span>;
  };

  const getPriorityBadge = (p: string) => {
    return <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${PRIORITY_COLORS[p] || PRIORITY_COLORS.low}`}>{p}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Welcome back, {user?.name?.split(" ")[0] || "Support Agent"}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/support/tickets")}>
            <Ticket size={14} className="mr-1" /> All Tickets
          </Button>
          <Button size="sm" onClick={() => navigate("/support/chat")}>
            <MessageSquare size={14} className="mr-1" /> Chat
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card size="sm" className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/support/tickets?status=open")}>
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Ticket size={18} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Open Tickets</p>
              <p className="text-xl font-bold">
                {loading ? <Loader2 size={14} className="animate-spin inline" /> : (stats?.open ?? 0) + (stats?.assigned ?? 0) + (stats?.in_progress ?? 0)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/support/faq")}>
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
              <HelpCircle size={18} className="text-amber-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Pending Approval</p>
              <p className="text-xl font-bold">{faqLoading ? <Loader2 size={14} className="animate-spin inline" /> : pendingFaqs.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/support/chat")}>
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center shrink-0">
              <Bell size={18} className="text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Unread Notifications</p>
              <p className="text-xl font-bold">{notifLoading ? <Loader2 size={14} className="animate-spin inline" /> : unreadCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card size="sm" className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate("/support/chat")}>
          <CardContent className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
              <Users size={18} className="text-green-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Total Customers</p>
              <p className="text-xl font-bold">{customerLoading ? <Loader2 size={14} className="animate-spin inline" /> : customers.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Ticket size={16} className="text-primary" /> Recent Tickets
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {recentTickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No tickets yet</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-white/[0.06]">
                {recentTickets.map((t) => (
                  <div key={t._id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate(`/support/tickets/${t._id}`)}>
                    <div className="min-w-0 flex-1 mr-3">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-medium truncate">{t.subject}</span>
                        {getPriorityBadge(t.priority)}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span>#{t._id?.slice(-6).toUpperCase()}</span>
                        {t.user_id?.name && <span>by {t.user_id.name}</span>}
                        <span>{new Date(t.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(t.status)}
                      <ArrowRight size={14} className="text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {recentTickets.length > 0 && (
              <div className="border-t dark:border-white/[0.06] px-5 py-2.5">
                <button onClick={() => navigate("/support/tickets")} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                  View all tickets <ArrowRight size={12} />
                </button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bell size={16} className="text-primary" /> Recent Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {notifLoading ? (
              <div className="text-center py-8"><Loader2 size={20} className="animate-spin mx-auto text-muted-foreground" /></div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No notifications</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-white/[0.06] max-h-[320px] overflow-y-auto">
                {notifications.slice(0, 5).map((n: any) => (
                  <div key={n._id} className="px-5 py-3 hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => { markRead(n._id); if (n.link) navigate(n.link); }}>
                    <div className="flex items-start gap-2">
                      <div className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${n.is_read ? "bg-transparent" : "bg-primary"}`} />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <HelpCircle size={16} className="text-amber-600" /> Pending FAQ Approval
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {faqLoading ? (
              <div className="text-center py-8"><Loader2 size={20} className="animate-spin mx-auto text-muted-foreground" /></div>
            ) : pendingFaqs.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle2 size={28} className="mx-auto text-green-500/40 mb-2" />
                <p className="text-xs text-muted-foreground">All submitted FAQs are approved</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-white/[0.06]">
                {pendingFaqs.map((f: any) => (
                  <div key={f._id} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{f.question}</p>
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                          {f.category && <Badge variant="outline" className="text-[10px] px-1.5">{f.category}</Badge>}
                          <span>by {f.created_by?.name || "Unknown"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Pending</Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="border-t dark:border-white/[0.06] px-5 py-2.5">
              <button onClick={() => navigate("/support/faq")} className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                Manage FAQs <ArrowRight size={12} />
              </button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <Users size={16} className="text-green-600" /> Recent Customers
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            {customerLoading ? (
              <div className="text-center py-8"><Loader2 size={20} className="animate-spin mx-auto text-muted-foreground" /></div>
            ) : customers.length === 0 ? (
              <div className="text-center py-8">
                <Users size={28} className="mx-auto text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">No customers yet</p>
              </div>
            ) : (
              <div className="divide-y dark:divide-white/[0.06] max-h-[320px] overflow-y-auto">
                {customers.map((c: any) => (
                  <div key={c._id} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                      {c.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{c.name || "Unnamed"}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{c.email || "No email"}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${c.status === "active" ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"}`}>
                      {c.status || "unknown"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <QuickAction icon={Ticket} label="Manage Tickets" desc="View, assign, and update tickets" onClick={() => navigate("/support/tickets")} />
        <QuickAction icon={MessageSquare} label="Customer Chat" desc="Respond to live chat requests" onClick={() => navigate("/support/chat")} />
        <QuickAction icon={FileText} label="FAQ Management" desc="Create and manage FAQs" onClick={() => navigate("/support/faq")} />
        <QuickAction icon={Users} label="Queue & Assign" desc="View queue and agent workload" onClick={() => navigate("/support/queue")} />
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, onClick }: { icon: any; label: string; desc: string; onClick: () => void }) {
  return (
    <Card size="sm" className="hover:shadow-md hover:border-primary/20 transition-all cursor-pointer" onClick={onClick}>
      <CardContent className="flex items-center gap-3 px-5 py-4">
        <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon size={16} className="text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-[11px] text-muted-foreground">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}
