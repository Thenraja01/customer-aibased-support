import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Loader2,
  Zap,
  Clock,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Users,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  UserCheck,
  ChevronRight,
  Sparkles,
  Inbox,
  AlertCircle,
  Activity,
  Layers,
  Scale,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TicketAPI, UsersAPI } from "@/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_COLORS: Record<string, string> = {
  open: "#3b82f6",
  assigned: "#8b5cf6",
  in_progress: "#f59e0b",
  waiting_for_customer: "#06b6d4",
  escalated: "#ef4444",
  reopened: "#ec4899",
  resolved: "#10b981",
  closed: "#64748b",
};

const SLA_COLORS = {
  on_track: "#10b981",
  warning: "#f59e0b",
  breached: "#ef4444",
};

export default function QueueManagementPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [data, setData] = useState<{ queue: any[]; workload: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [assigningAll, setAssigningAll] = useState(false);
  const [closing, setClosing] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedPriority, setSelectedPriority] = useState<string>("all");
  const [selectedSlaState, setSelectedSlaState] = useState<string>("all");
  const [selectedAgentFilter, setSelectedAgentFilter] = useState<string>("all");

  const loadQueue = (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    TicketAPI.getQueue()
      .then((res: any) => {
        if (res.data.success) {
          setData(res.data.data);
        }
      })
      .catch(() => toast.error("Error", "Failed to load queue telemetry"))
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    loadQueue();
    // Refresh queue automatically every 60s
    const interval = setInterval(() => loadQueue(true), 60000);
    return () => clearInterval(interval);
  }, []);

  // Smart assign a single ticket
  const handleSmartAssign = async (ticketId: string) => {
    setAssigning(ticketId);
    try {
      const res = await TicketAPI.smartAssign(ticketId);
      if (res.data?.success) {
        toast.success("Assigned", "Ticket routed successfully via smart algorithm");
      }
      loadQueue(true);
    } catch (err: any) {
      toast.error("Assignment Failed", err?.response?.data?.message || "No available agent found");
    } finally {
      setAssigning(null);
    }
  };

  // Smart dispatch all unassigned tickets
  const handleSmartAssignAll = async () => {
    const unassignedTickets = data?.queue?.filter((t) => !t.assigned_to) || [];
    if (unassignedTickets.length === 0) {
      toast.info("Notice", "No unassigned tickets in queue");
      return;
    }

    setAssigningAll(true);
    let successCount = 0;
    for (const ticket of unassignedTickets) {
      try {
        await TicketAPI.smartAssign(ticket._id);
        successCount++;
      } catch {}
    }
    toast.success("Batch Dispatch Complete", `Dispatched ${successCount} tickets`);
    loadQueue(true);
    setAssigningAll(false);
  };

  const handleClose = async (ticketId: string) => {
    setClosing(ticketId);
    try {
      await TicketAPI.close(ticketId);
      toast.success("Ticket Closed", "Ticket status changed to closed");
      loadQueue(true);
    } catch {
      toast.error("Error", "Failed to close ticket");
    } finally {
      setClosing(null);
    }
  };

  // Quick reassign to a specific support agent
  const handleDirectAssign = async (ticketId: string, supportId: string) => {
    try {
      await TicketAPI.assign(ticketId, { supportId });
      toast.success("Reassigned", "Ticket reassigned successfully");
      loadQueue(true);
    } catch {
      toast.error("Error", "Failed to reassign ticket");
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent":
      case "critical":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20";
      case "medium":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      case "low":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  // Helper for generating avatar URL
  const getCustomerAvatar = (name: string, email: string) => {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || email || "Customer")}&background=4f46e5&color=ffffff&bold=true&rounded=true&format=svg`;
  };

  // Helper for SLA state classification & remaining time
  const getSlaInfo = (ticket: any) => {
    const status = ticket.sla_status || (ticket.is_resolution_breached || ticket.is_first_response_breached ? "breached" : "on_track");
    const dueTime = ticket.resolution_due || ticket.first_response_due;

    let timeText = "On Track";
    let isBreached = status === "breached";
    let isWarning = status === "warning";

    if (dueTime) {
      const diffMs = new Date(dueTime).getTime() - Date.now();
      const diffMins = Math.round(diffMs / 60000);
      const diffHours = (diffMs / 3600000).toFixed(1);

      if (diffMs < 0) {
        isBreached = true;
        timeText = `Breached (${Math.abs(diffMins)}m ago)`;
      } else if (diffMins < 60) {
        isWarning = true;
        timeText = `${diffMins}m remaining`;
      } else {
        timeText = `${diffHours}h remaining`;
      }
    }

    return {
      status: isBreached ? "breached" : isWarning ? "warning" : "on_track",
      timeText,
      dueTime,
    };
  };

  // Calculations for Telemetry & Charts
  const queue = data?.queue || [];
  const workload = data?.workload || [];

  const metrics = useMemo(() => {
    let breached = 0;
    let warning = 0;
    let onTrack = 0;
    let unassigned = 0;

    queue.forEach((ticket) => {
      const sla = getSlaInfo(ticket);
      if (sla.status === "breached") breached++;
      else if (sla.status === "warning") warning++;
      else onTrack++;

      if (!ticket.assigned_to) unassigned++;
    });

    const total = queue.length;
    const healthPct = total > 0 ? Math.round(((total - breached) / total) * 100) : 100;

    return {
      total,
      breached,
      warning,
      onTrack,
      unassigned,
      healthPct,
    };
  }, [queue]);

  // Round Donut Chart: Status Breakdown
  const statusChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    queue.forEach((t) => {
      const st = t.status || "open";
      counts[st] = (counts[st] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace(/_/g, " ").toUpperCase(),
      value,
      key: name,
      color: STATUS_COLORS[name] || "#6366f1",
    }));
  }, [queue]);

  // Round Donut Chart: SLA Limit Reachable State Breakdown
  const slaChartData = useMemo(() => {
    return [
      { name: "On Track", value: metrics.onTrack, color: SLA_COLORS.on_track },
      { name: "SLA Limit Reachable (Warning)", value: metrics.warning, color: SLA_COLORS.warning },
      { name: "SLA Breached", value: metrics.breached, color: SLA_COLORS.breached },
    ].filter((d) => d.value > 0);
  }, [metrics]);

  // Filtered Queue
  const filteredQueue = useMemo(() => {
    return queue.filter((ticket) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesSubject = ticket.subject?.toLowerCase().includes(q);
        const matchesId = ticket._id?.toLowerCase().includes(q) || ticket.ticket_number?.toLowerCase().includes(q);
        const matchesCustomer =
          ticket.user_id?.name?.toLowerCase().includes(q) || ticket.user_id?.email?.toLowerCase().includes(q);
        const matchesAgent = ticket.assigned_to?.name?.toLowerCase().includes(q);
        if (!matchesSubject && !matchesId && !matchesCustomer && !matchesAgent) return false;
      }

      // Status
      if (selectedStatus !== "all" && ticket.status !== selectedStatus) return false;

      // Priority
      if (selectedPriority !== "all" && ticket.priority !== selectedPriority) return false;

      // SLA State
      if (selectedSlaState !== "all") {
        const sla = getSlaInfo(ticket);
        if (sla.status !== selectedSlaState) return false;
      }

      // Agent Filter
      if (selectedAgentFilter !== "all") {
        if (selectedAgentFilter === "unassigned") {
          if (ticket.assigned_to) return false;
        } else if (ticket.assigned_to?._id !== selectedAgentFilter) {
          return false;
        }
      }

      return true;
    });
  }, [queue, searchQuery, selectedStatus, selectedPriority, selectedSlaState, selectedAgentFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-xs text-muted-foreground font-mono">Streaming queue telemetry & SLA state...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2.5">
            <Layers className="text-primary" size={24} /> Queue Management & SLA Telemetry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time ticket queue status, reachable SLA limit monitoring, customer details, and automated smart dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadQueue(true)}
            disabled={refreshing}
            className="h-9 gap-1.5 text-xs font-semibold"
          >
            <RefreshCw size={13} className={cn(refreshing && "animate-spin")} /> Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleSmartAssignAll}
            disabled={assigningAll || metrics.unassigned === 0}
            className="h-9 gap-1.5 text-xs font-semibold shadow-sm"
          >
            {assigningAll ? <Loader2 size={13} className="animate-spin" /> : <Zap size={13} />}
            Auto-Dispatch Unassigned ({metrics.unassigned})
          </Button>
        </div>
      </div>

      {/* KPI Metrics Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 rounded-2xl border bg-card/60 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Inbox size={12} className="text-primary" /> Total Queue
          </span>
          <p className="text-2xl font-black text-foreground">{metrics.total}</p>
          <span className="text-[10px] text-muted-foreground">Active pending tickets</span>
        </div>

        <div className="p-4 rounded-2xl border bg-rose-500/[0.04] border-rose-500/20 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-rose-500 uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert size={12} /> SLA Breached
          </span>
          <p className="text-2xl font-black text-rose-500">{metrics.breached}</p>
          <span className="text-[10px] text-rose-500/80">Immediate attention</span>
        </div>

        <div className="p-4 rounded-2xl border bg-amber-500/[0.04] border-amber-500/20 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-amber-500 uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle size={12} /> SLA Limit Reachable
          </span>
          <p className="text-2xl font-black text-amber-500">{metrics.warning}</p>
          <span className="text-[10px] text-amber-500/80">&lt;50% time remaining</span>
        </div>

        <div className="p-4 rounded-2xl border bg-emerald-500/[0.04] border-emerald-500/20 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 size={12} /> On Track
          </span>
          <p className="text-2xl font-black text-emerald-500">{metrics.onTrack}</p>
          <span className="text-[10px] text-emerald-500/80">Within target SLA</span>
        </div>

        <div className="p-4 rounded-2xl border bg-card/60 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Zap size={12} className="text-indigo-500" /> Unassigned
          </span>
          <p className="text-2xl font-black text-indigo-400">{metrics.unassigned}</p>
          <span className="text-[10px] text-muted-foreground">Pending agent routing</span>
        </div>

        <div className="p-4 rounded-2xl border bg-card/60 shadow-sm space-y-1">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
            <Activity size={12} className="text-emerald-500" /> SLA Health
          </span>
          <p className="text-2xl font-black text-foreground">{metrics.healthPct}%</p>
          <span className="text-[10px] text-muted-foreground">Compliance rate</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2 INTERACTIVE ROUND CHARTS: STATUS BREAKDOWN & SLA LIMIT REACHABLE STATE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Chart 1: Status Round Chart */}
        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <PieChart size={15} className="text-primary" /> Ticket Status Round Breakdown
              </h3>
              <p className="text-xs text-muted-foreground">Distribution of active tickets by lifecycle state</p>
            </div>
            <Badge variant="outline" className="text-xs font-mono">
              {metrics.total} Total
            </Badge>
          </div>

          {statusChartData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">
              No active tickets in queue
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-48 w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={76}
                      paddingAngle={3}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={`status-cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="space-y-2">
                {statusChartData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold text-foreground font-mono">
                      {item.value} ({Math.round((item.value / (metrics.total || 1)) * 100)}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: SLA Limit Reachable State Round Chart */}
        <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold flex items-center gap-2">
                <ShieldAlert size={15} className="text-amber-500" /> SLA Limit Reachable State Chart
              </h3>
              <p className="text-xs text-muted-foreground">Urgency radar: On Track vs At-Risk Warning vs Breached</p>
            </div>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-mono",
                metrics.breached > 0 ? "border-rose-500/40 text-rose-500" : "border-emerald-500/40 text-emerald-500"
              )}
            >
              {metrics.healthPct}% Compliance
            </Badge>
          </div>

          {metrics.total === 0 ? (
            <div className="h-52 flex items-center justify-center text-xs text-muted-foreground">
              Queue is clear (No tickets pending SLA)
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
              <div className="h-48 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={slaChartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={46}
                      outerRadius={76}
                      paddingAngle={4}
                    >
                      {slaChartData.map((entry, index) => (
                        <Cell key={`sla-cell-${index}`} fill={entry.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#09090b",
                        border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: "12px",
                        fontSize: "12px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center Gauge Percentage */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-lg font-black text-foreground font-mono leading-none">{metrics.healthPct}%</span>
                  <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Healthy</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="font-semibold text-emerald-500">On Track SLA</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{metrics.onTrack}</span>
                </div>

                <div className="p-2.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.05] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <span className="font-semibold text-amber-500">SLA Limit Reachable</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{metrics.warning}</span>
                </div>

                <div className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.05] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                    <span className="font-semibold text-rose-500">SLA Breached</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{metrics.breached}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. AGENT WORKLOAD & CAPACITY LIVE GRID */}
      {/* ========================================================================= */}
      <div className="p-5 rounded-3xl border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-bold flex items-center gap-2">
              <Users size={16} className="text-primary" /> Active Support Agents & Capacity Load
            </h3>
            <p className="text-xs text-muted-foreground">Click an agent to filter the queue by their assigned tickets</p>
          </div>
          {selectedAgentFilter !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedAgentFilter("all")}
              className="text-xs text-primary h-7"
            >
              Clear Agent Filter
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {workload.map((agent: any) => {
            const maxCap = agent.maxActiveTickets || 10;
            const openCount = agent.openTickets || 0;
            const capPct = Math.min(Math.round((openCount / maxCap) * 100), 100);
            const isSelected = selectedAgentFilter === agent._id;

            return (
              <div
                key={agent._id}
                onClick={() => setSelectedAgentFilter(isSelected ? "all" : agent._id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                  isSelected
                    ? "border-primary bg-primary/[0.06] ring-1 ring-primary/40"
                    : "border-border bg-card/60 hover:border-primary/40 hover:bg-muted/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 overflow-hidden shrink-0">
                    <img
                      src={getCustomerAvatar(agent.name, agent.email)}
                      alt={agent.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-foreground truncate">{agent.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{agent.email}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[11px] text-muted-foreground">Load Capacity</span>
                    <span className="font-bold font-mono">
                      {openCount} / {maxCap}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      style={{ width: `${capPct}%` }}
                      className={cn(
                        "h-full rounded-full transition-all duration-300",
                        capPct > 80 ? "bg-rose-500" : capPct > 50 ? "bg-amber-500" : "bg-emerald-500"
                      )}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. TICKET QUEUE TABLE WITH CUSTOMER DETAILS & SLA STATE */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border bg-card shadow-sm overflow-hidden space-y-0">
        {/* Search and Filters Bar */}
        <div className="p-5 border-b bg-card/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by ticket #, subject, customer name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* SLA Filter */}
            <select
              value={selectedSlaState}
              onChange={(e) => setSelectedSlaState(e.target.value)}
              className="h-9 px-3 text-xs bg-card border rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">SLA: All States</option>
              <option value="breached">🔴 SLA Breached</option>
              <option value="warning">🟡 SLA Limit Reachable</option>
              <option value="on_track">🟢 SLA On Track</option>
            </select>

            {/* Priority Filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="h-9 px-3 text-xs bg-card border rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Priority: All</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-3 text-xs bg-card border rounded-xl font-medium focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">Status: All</option>
              <option value="open">Open</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_for_customer">Waiting for Customer</option>
              <option value="escalated">Escalated</option>
            </select>

            {/* Unassigned Only Quick Toggle */}
            <Button
              variant={selectedAgentFilter === "unassigned" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedAgentFilter(selectedAgentFilter === "unassigned" ? "all" : "unassigned")}
              className="h-9 text-xs"
            >
              <Zap size={12} className="mr-1" /> Unassigned Only
            </Button>
          </div>
        </div>

        {/* Queue Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b bg-muted/30 text-muted-foreground font-semibold">
                <th className="text-left py-3.5 px-4">Ticket</th>
                <th className="text-left py-3.5 px-4">Customer Details</th>
                <th className="text-left py-3.5 px-4">Priority</th>
                <th className="text-left py-3.5 px-4">Status</th>
                <th className="text-left py-3.5 px-4">SLA Reachable State</th>
                <th className="text-left py-3.5 px-4">Assigned Agent</th>
                <th className="text-right py-3.5 px-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 space-y-2">
                    <Inbox size={32} className="mx-auto text-muted-foreground/50" />
                    <p className="text-sm font-semibold text-muted-foreground">No tickets match your filters</p>
                    <p className="text-xs text-muted-foreground/70">Try resetting filters or searching for another term</p>
                  </td>
                </tr>
              ) : (
                filteredQueue.map((ticket: any) => {
                  const sla = getSlaInfo(ticket);
                  const customerName = ticket.user_id?.name || "Anonymous Customer";
                  const customerEmail = ticket.user_id?.email || "No email provided";

                  return (
                    <tr key={ticket._id} className="hover:bg-muted/30 transition-colors">
                      {/* Ticket Number & Subject */}
                      <td className="py-3.5 px-4 max-w-[240px]">
                        <div className="space-y-1">
                          <span className="font-mono text-[10px] text-muted-foreground font-bold">
                            #{ticket.ticket_number || ticket._id?.slice(-6)}
                          </span>
                          <button
                            onClick={() => navigate(`/support/tickets/${ticket._id}`)}
                            className="block text-xs font-bold text-foreground hover:text-primary transition-colors truncate text-left w-full"
                            title={ticket.subject}
                          >
                            {ticket.subject}
                          </button>
                          <span className="text-[10px] text-muted-foreground block">{timeAgo(ticket.created_at)}</span>
                        </div>
                      </td>

                      {/* Customer Details */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 overflow-hidden shrink-0">
                            <img
                              src={getCustomerAvatar(customerName, customerEmail)}
                              alt={customerName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground truncate max-w-[140px]">{customerName}</p>
                            <p className="text-[11px] text-muted-foreground truncate max-w-[140px] font-mono">{customerEmail}</p>
                          </div>
                        </div>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4">
                        <span className={cn("text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase", priorityColor(ticket.priority))}>
                          {ticket.priority || "normal"}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className="capitalize font-semibold text-muted-foreground text-xs">
                          {ticket.status?.replace(/_/g, " ") || "open"}
                        </span>
                      </td>

                      {/* SLA Reachable State */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          {sla.status === "breached" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-500 bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                              <ShieldAlert size={11} /> {sla.timeText}
                            </span>
                          ) : sla.status === "warning" ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                              <AlertTriangle size={11} /> {sla.timeText}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                              <CheckCircle2 size={11} /> {sla.timeText}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Agent */}
                      <td className="py-3.5 px-4">
                        {ticket.assigned_to ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted overflow-hidden shrink-0 border">
                              <img
                                src={getCustomerAvatar(ticket.assigned_to.name, ticket.assigned_to.email)}
                                alt={ticket.assigned_to.name}
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <span className="font-semibold text-foreground truncate max-w-[110px]">
                              {ticket.assigned_to.name}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                            ⚡ Unassigned
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!ticket.assigned_to ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSmartAssign(ticket._id)}
                              disabled={assigning === ticket._id}
                              className="h-7 px-2.5 text-[11px] font-semibold text-primary border-primary/30 hover:bg-primary/10 gap-1"
                            >
                              {assigning === ticket._id ? (
                                <Loader2 size={11} className="animate-spin" />
                              ) : (
                                <Zap size={11} />
                              )}
                              Smart Assign
                            </Button>
                          ) : (
                            <select
                              value={ticket.assigned_to._id}
                              onChange={(e) => handleDirectAssign(ticket._id, e.target.value)}
                              className="h-7 px-2 text-[10px] bg-card border rounded-lg font-medium text-muted-foreground hover:text-foreground focus:outline-none"
                            >
                              <option value={ticket.assigned_to._id}>{ticket.assigned_to.name} (Assigned)</option>
                              {workload
                                .filter((a) => a._id !== ticket.assigned_to._id)
                                .map((a) => (
                                  <option key={a._id} value={a._id}>
                                    Reassign → {a.name} ({a.openTickets} active)
                                  </option>
                                ))}
                            </select>
                          )}

                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/support/tickets/${ticket._id}`)}
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                            title="Open Ticket"
                          >
                            <ChevronRight size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
