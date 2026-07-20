import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { TicketAPI } from '@/api/ticket.api';
import {
  Ticket, Clock, CheckCircle2, AlertTriangle, MessageSquare,
  TrendingUp, Activity, ChevronRight, RefreshCw,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/UI/StatusBadge';
import { formatRelativeTime } from '@/utils/formatters';

// ─── Metric card ────────────────────────────────────────────────────────────
function StatCard({
  label, value, icon, color, loading,
}: { label: string; value: number; icon: React.ReactNode; color: string; loading: boolean }) {
  return (
    <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        {loading ? (
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-24" />
            <div className="h-8 bg-muted rounded w-16" />
          </div>
        ) : (
          <>
            <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl mb-3 ${color}`}>
              {icon}
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground mt-0.5">{label}</div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Priority pill ────────────────────────────────────────────────────────────
const PRIORITY_STYLE: Record<string, string> = {
  urgent: 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-400',
  high:   'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-400',
  medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400',
  low:    'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400',
};

// ─── SLA alert ────────────────────────────────────────────────────────────────
function SLAAlert({ breachedCount }: { breachedCount: number }) {
  if (!breachedCount) return null;
  return (
    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400">
      <AlertTriangle size={18} className="shrink-0" />
      <span className="text-sm font-medium">
        {breachedCount} ticket{breachedCount > 1 ? 's' : ''} have breached SLA — review immediately
      </span>
      <Link to="/support/tickets?status=open&sla=breached" className="ml-auto text-xs underline shrink-0">
        View
      </Link>
    </div>
  );
}

// ─── Main dashboard ───────────────────────────────────────────────────────────
export function SupportDashboard() {
  const [stats, setStats]     = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (quiet = false) => {
    if (!quiet) setLoading(true);
    else setRefreshing(true);
    try {
      const [statsRes, ticketsRes] = await Promise.all([
        TicketAPI.getStats(),
        TicketAPI.getAll({ limit: '8', sort: 'created_at:desc' }),
      ]);
      setStats(statsRes.data.data ?? statsRes.data);
      const raw = ticketsRes.data.data ?? ticketsRes.data;
      setTickets(Array.isArray(raw) ? raw.slice(0, 8) : []);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const open        = stats?.open       ?? 0;
  const inProgress  = stats?.in_progress ?? 0;
  const resolved    = stats?.resolved   ?? 0;
  const total       = stats?.total      ?? 0;
  const breached    = stats?.sla_breached ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Support Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Real-time overview of your support queue</p>
        </div>
        <button
          onClick={() => load(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 text-sm rounded-lg border hover:bg-muted transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* SLA breach alert */}
      <SLAAlert breachedCount={breached} />

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Open Tickets"  value={open}       icon={<Ticket size={18} className="text-amber-600" />}  color="bg-amber-50 dark:bg-amber-950/30"  loading={loading} />
        <StatCard label="In Progress"   value={inProgress}  icon={<Clock size={18} className="text-blue-600" />}    color="bg-blue-50 dark:bg-blue-950/30"    loading={loading} />
        <StatCard label="Resolved"      value={resolved}    icon={<CheckCircle2 size={18} className="text-emerald-600" />} color="bg-emerald-50 dark:bg-emerald-950/30" loading={loading} />
        <StatCard label="Total Today"   value={total}       icon={<TrendingUp size={18} className="text-purple-600" />}    color="bg-purple-50 dark:bg-purple-950/30"   loading={loading} />
      </div>

      {/* Recent tickets */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base font-semibold">Recent Tickets</CardTitle>
              <Link to="/support/tickets" className="text-xs text-primary flex items-center gap-1 hover:underline">
                View all <ChevronRight size={12} />
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="divide-y">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                      <div className="h-4 bg-muted rounded flex-1" />
                      <div className="h-5 bg-muted rounded w-16" />
                    </div>
                  ))}
                </div>
              ) : tickets.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <Ticket size={36} className="mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No tickets yet</p>
                </div>
              ) : (
                <div className="divide-y dark:divide-white/[0.04]">
                  {tickets.map(t => (
                    <Link
                      key={t._id}
                      to={`/support/tickets/${t._id}`}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 dark:hover:bg-white/[0.02] transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{t.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.user_id?.name ?? 'Customer'} · {formatRelativeTime(t.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${PRIORITY_STYLE[t.priority] ?? ''}`}>
                          {t.priority}
                        </span>
                        <StatusBadge status={t.status} />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick actions panel */}
        <div className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Activity size={16} className="text-primary" /> Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {[
                { label: 'Open Tickets',    path: '/support/tickets?status=open',        badge: open,       color: 'text-amber-600' },
                { label: 'In Progress',     path: '/support/tickets?status=in_progress', badge: inProgress, color: 'text-blue-600' },
                { label: 'Live Chat',       path: '/support/chat',                       badge: null,       color: 'text-emerald-600' },
                { label: 'Pending Docs',    path: '/support/documents',                  badge: null,       color: 'text-purple-600' },
              ].map(item => (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-muted dark:hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-sm font-medium">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.badge !== null && item.badge > 0 && (
                      <span className={`text-xs font-bold ${item.color}`}>{item.badge}</span>
                    )}
                    <ChevronRight size={14} className="text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <MessageSquare size={16} className="text-primary" /> Ticket Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {loading ? (
                <div className="h-24 bg-muted animate-pulse rounded" />
              ) : (
                <div className="space-y-2">
                  {[
                    { label: 'Open',       value: open,       max: total || 1, color: 'bg-amber-400' },
                    { label: 'In Progress',value: inProgress, max: total || 1, color: 'bg-blue-400' },
                    { label: 'Resolved',   value: resolved,   max: total || 1, color: 'bg-emerald-400' },
                  ].map(bar => (
                    <div key={bar.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">{bar.label}</span>
                        <span className="font-medium">{bar.value}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${bar.color}`}
                          style={{ width: `${Math.min((bar.value / bar.max) * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
