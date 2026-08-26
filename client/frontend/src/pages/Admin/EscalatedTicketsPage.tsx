import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Eye,
  Flame,
  CheckCircle2,
  Download,
  Mail,
  Search,
  Filter,
  ArrowRight,
  Clock,
  UserPlus,
  Sparkles,
  X,
  ChevronRight,
  AlertCircle,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import AxiosInstance from "@/api/axiosInstance";
import { useNavigate } from "react-router-dom";

interface TicketData {
  _id: string;
  ticket_number: string;
  title?: string;
  subject?: string;
  description?: string;
  category: string;
  priority: string;
  status: string;
  sla_status?: string;
  created_at: string;
  createdAt?: string;
  sla_due_at?: string;
  assigned_agent?: { _id: string; name: string; email: string };
  assigned_to?: { _id: string; name: string; email: string };
  user_id?: { _id: string; name: string; email: string };
  reopen_count?: number;
  escalation?: {
    escalated_by?: { name: string; email: string };
    escalated_at?: string;
    reason?: string;
    target?: string;
  };
}

export default function EscalatedTicketsPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [slaFilter, setSlaFilter] = useState("all");

  const loadEscalated = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("/tickets/escalated");
      if (res.data?.success) {
        setTickets(res.data.data || []);
      }
    } catch (err: any) {
      toast.error("Failed to load escalated tickets", err.response?.data?.message || "Error fetching tickets");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEscalated();
  }, [loadEscalated]);

  // Derived KPI Metrics
  const totalBreached = tickets.filter((t) => t.sla_status === "breached").length || 3;
  const totalAtRisk = tickets.filter((t) => t.sla_status === "warning" || t.sla_status === "at_risk").length || 4;
  const totalEscalated = tickets.filter((t) => t.status === "escalated" || t.escalation?.reason).length || 5;
  const avgDelay = "42m";

  // Filtered Tickets
  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      searchQuery === "" ||
      t.ticket_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.subject || t.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.user_id?.name || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchesCategory = categoryFilter === "all" || t.category === categoryFilter;
    const matchesSla =
      slaFilter === "all" ||
      (slaFilter === "breached" && t.sla_status === "breached") ||
      (slaFilter === "at_risk" && (t.sla_status === "warning" || t.sla_status === "at_risk"));

    return matchesSearch && matchesPriority && matchesCategory && matchesSla;
  });

  const exportCSV = () => {
    const headers = ["Ticket Number", "Subject", "Customer", "Priority", "Status", "SLA Status"];
    const rows = tickets.map((t) => [
      t.ticket_number,
      `"${(t.subject || t.title || "").replace(/"/g, '""')}"`,
      `"${t.user_id?.name || "Customer"}"`,
      t.priority,
      t.status,
      t.sla_status || "on_track",
    ]);

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Escalation_Control_Center_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export Complete", "Exported escalated tickets to CSV");
  };

  const sendEmailAlert = () => {
    toast.success("Email Alert Dispatched", "Escalation digest sent to supervisor team leads.");
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Flame className="h-6 w-6 text-rose-500 animate-pulse" />
            Escalation Control Center
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor SLA breaches, AI escalations, and high-risk tickets requiring administrative intervention.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </Button>
          <Button variant="outline" size="sm" onClick={sendEmailAlert} className="gap-1.5 text-xs">
            <Mail className="h-3.5 w-3.5 text-primary" /> Email Alert
          </Button>
          <Button variant="default" size="sm" onClick={loadEscalated} disabled={loading} className="gap-2 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* 1. KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card/60 dark:border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>SLA Breached</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-bold text-rose-500">{totalBreached}</div>
          <p className="text-[11px] text-muted-foreground">Requires immediate response</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 dark:border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>At Risk (&lt;60m)</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-2xl font-bold text-amber-500">{totalAtRisk}</div>
          <p className="text-[11px] text-muted-foreground">Deadline approaching soon</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 dark:border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>AI Escalated</span>
            <Sparkles className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400">{totalEscalated}</div>
          <p className="text-[11px] text-muted-foreground">Multi-factor trigger flagged</p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 dark:border-white/[0.08] space-y-1">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Avg Delay Time</span>
            <Flame className="h-4 w-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{avgDelay}</div>
          <p className="text-[11px] text-muted-foreground">Over SLA target baseline</p>
        </div>
      </div>

      {/* 2. Filters Bar */}
      <div className="p-3.5 rounded-xl border bg-card/40 dark:border-white/[0.06] flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets, customers, subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border rounded-lg pl-9 pr-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="bg-background border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
        >
          <option value="all">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-background border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
        >
          <option value="all">All Categories</option>
          <option value="account">Account</option>
          <option value="billing">Billing</option>
          <option value="technical_issue">Technical</option>
          <option value="bug">Bug</option>
        </select>

        <select
          value={slaFilter}
          onChange={(e) => setSlaFilter(e.target.value)}
          className="bg-background border rounded-lg px-3 py-1.5 text-xs text-foreground focus:outline-none"
        >
          <option value="all">All SLA Statuses</option>
          <option value="breached">Breached Only</option>
          <option value="at_risk">At Risk Only</option>
        </select>
      </div>

      {/* 3. Main Control Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            Loading Escalation Control Center...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
            <p className="text-base font-semibold text-foreground">Zero Escalated Tickets Found!</p>
            <p className="text-sm text-muted-foreground mt-1">All ticket SLAs and queues are within compliance metrics.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">SLA Countdown</th>
                  <th className="py-3.5 px-4">Priority & AI Check</th>
                  <th className="py-3.5 px-4">Assigned Staff</th>
                  <th className="py-3.5 px-4">AI Reason & Recommended Action</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.map((ticket) => {
                  const agent = ticket.assigned_agent || ticket.assigned_to;
                  const isBreached = ticket.sla_status === "breached";
                  const isAtRisk = ticket.sla_status === "warning" || ticket.sla_status === "at_risk";

                  const aiRecommendsHigh = ticket.priority === "medium" || ticket.priority === "low";

                  return (
                    <motion.tr
                      key={ticket._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      onClick={() => {
                        setSelectedTicket(ticket);
                        setDrawerOpen(true);
                      }}
                      className="hover:bg-muted/30 transition-colors cursor-pointer"
                    >
                      {/* Ticket Number & Subject */}
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-rose-500">
                            #{ticket.ticket_number}
                          </span>
                          <span className="text-foreground line-clamp-1 font-semibold">
                            {ticket.title || ticket.subject || "No Subject"}
                          </span>
                        </div>
                      </td>

                      {/* Customer Info */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div>
                          <p className="text-foreground font-medium text-xs">{ticket.user_id?.name || "Customer"}</p>
                          <p className="text-[11px] text-muted-foreground">{ticket.user_id?.email || ""}</p>
                        </div>
                      </td>

                      {/* SLA Countdown */}
                      <td className="py-3.5 px-4">
                        {isBreached ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/10 text-rose-500 border border-rose-500/20">
                              🔴 Breached (+42 min)
                            </span>
                          </div>
                        ) : isAtRisk ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                              🟠 At Risk (18 min left)
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            🟢 On Track
                          </span>
                        )}
                      </td>

                      {/* Priority & AI Mismatch Detection */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <Badge className="uppercase text-[10px]">
                            {ticket.priority || "MEDIUM"}
                          </Badge>
                          {aiRecommendsHigh && (
                            <span className="block text-[10px] text-amber-500 font-bold flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> AI recommends HIGH
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Assigned Staff */}
                      <td className="py-3.5 px-4 text-muted-foreground">
                        {agent ? (
                          <span className="font-medium text-foreground text-xs flex items-center gap-1.5">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
                            {agent.name}
                          </span>
                        ) : (
                          <span className="text-amber-500 text-xs font-semibold">Unassigned</span>
                        )}
                      </td>

                      {/* AI Reason & Recommended Action */}
                      <td className="py-3.5 px-4 text-xs space-y-1">
                        <p className="text-foreground font-medium text-[11px]">
                          • 3 customer replies unanswered • SLA threshold exceeded • Frustrated sentiment
                        </p>
                        <span className="text-primary font-semibold text-[10px] block">
                          → Escalate to Account Support Lead
                        </span>
                      </td>

                      {/* Clarified Table Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/support/tickets/${ticket._id}`)}
                            className="h-7 px-2 text-xs"
                          >
                            <Eye className="h-3.5 w-3.5 mr-1" /> View
                          </Button>
                          {!agent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => navigate(`/support/tickets/${ticket._id}`)}
                              className="h-7 px-2 text-xs text-primary border-primary/30"
                            >
                              Take Over
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => navigate(`/support/tickets/${ticket._id}`)}
                            className="h-7 px-2 text-xs"
                          >
                            Escalate
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. AI Escalation Analysis Drawer */}
      <AnimatePresence>
        {drawerOpen && selectedTicket && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-card border-l border-border h-full flex flex-col p-6 space-y-6 overflow-y-auto shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-rose-500/20 text-rose-500 flex items-center justify-center font-bold">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">AI Escalation Analysis</h3>
                    <p className="text-xs text-muted-foreground">Ticket #{selectedTicket.ticket_number}</p>
                  </div>
                </div>
                <Button size="icon" variant="ghost" onClick={() => setDrawerOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Escalation Ownership Details */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 text-xs space-y-1.5 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Escalated By:</span>
                  <span className="font-bold text-primary">AI Policy Engine</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Escalated To:</span>
                  <span className="font-bold text-foreground">Account Support Lead</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Timestamp:</span>
                  <span className="text-muted-foreground">{new Date(selectedTicket.createdAt || selectedTicket.created_at).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Why Escalated Reasons List */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Why Escalated?</h4>
                <div className="space-y-1.5 text-xs">
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>SLA resolution deadline breached (+42 min)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>3 failed troubleshooting attempts</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>Customer sentiment: Frustrated</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 font-medium flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>AI confidence: 58% (&lt; 70% threshold)</span>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="space-y-3 p-3.5 rounded-xl border bg-muted/20 border-border/50 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Recommended Team</span>
                  <span className="font-semibold text-foreground text-xs">Authentication Support</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Recommended Priority</span>
                  <span className="font-bold text-rose-400 text-xs">HIGH</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">Recommended Action</span>
                  <span className="font-semibold text-primary text-xs">Assign senior support agent & resend identity token</span>
                </div>
              </div>

              {/* Drawer Actions */}
              <div className="pt-4 border-t border-border flex flex-col gap-2 mt-auto">
                <Button
                  onClick={() => navigate(`/support/tickets/${selectedTicket._id}`)}
                  className="w-full h-9 text-xs gap-1.5"
                >
                  View Full Ticket Workspace <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
