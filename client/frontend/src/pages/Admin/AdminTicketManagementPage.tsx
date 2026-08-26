import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Ticket as TicketIcon,
  Search,
  Filter,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  Eye,
  ShieldAlert,
  Inbox,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import AxiosInstance from "@/api/axiosInstance";
import { useNavigate } from "react-router-dom";

type TicketTab = "all" | "new" | "open" | "pending" | "resolved" | "closed";

interface TicketData {
  _id: string;
  ticket_number: string;
  title?: string;
  subject?: string;
  category: string;
  priority: string;
  status: string;
  sla_status?: string;
  created_at: string;
  sla_due_at?: string;
  assigned_agent?: { _id: string; name: string; email: string };
  assigned_to?: { _id: string; name: string; email: string };
  user_id?: { _id: string; name: string; email: string };
  organization_id?: { _id: string; name: string };
  branch_id?: { _id: string; name: string };
}

export default function AdminTicketManagementPage() {
  const toast = useToast();
  const navigate = useNavigate();

  const [tickets, setTickets] = useState<TicketData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TicketTab>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("all");
  const [selectedCategory] = useState("all");

  const loadTickets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get("/tickets?limit=200");
      if (res.data?.success) {
        setTickets(res.data.data || []);
      }
    } catch (err: any) {
      toast.error("Failed to load tickets", err.response?.data?.message || "Error fetching tickets");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const filteredTickets = tickets.filter((t) => {
    // Status tab filter
    if (activeTab === "new" && t.status !== "new") return false;
    if (activeTab === "open" && t.status !== "open" && t.status !== "in_progress") return false;
    if (activeTab === "pending" && t.status !== "pending" && t.status !== "waiting_for_customer") return false;
    if (activeTab === "resolved" && t.status !== "resolved") return false;
    if (activeTab === "closed" && t.status !== "closed" && t.status !== "cancelled") return false;

    // Priority filter
    if (selectedPriority !== "all" && t.priority !== selectedPriority) return false;

    // Category filter
    if (selectedCategory !== "all" && t.category !== selectedCategory) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const numMatch = t.ticket_number?.toLowerCase().includes(q);
      const titleMatch = (t.title || t.subject || "").toLowerCase().includes(q);
      const userMatch = t.user_id?.name?.toLowerCase().includes(q) || t.user_id?.email?.toLowerCase().includes(q);
      if (!numMatch && !titleMatch && !userMatch) return false;
    }

    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "open":
      case "in_progress":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "pending":
      case "waiting_for_customer":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "resolved":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "closed":
      case "cancelled":
        return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
      case "escalated":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-rose-500/10 text-rose-500 border-rose-500/20";
      case "high":
        return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      case "medium":
        return "bg-primary/10 text-primary border-primary/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  const counts = {
    all: tickets.length,
    new: tickets.filter((t) => t.status === "new").length,
    open: tickets.filter((t) => t.status === "open" || t.status === "in_progress").length,
    pending: tickets.filter((t) => t.status === "pending" || t.status === "waiting_for_customer").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
    closed: tickets.filter((t) => t.status === "closed" || t.status === "cancelled").length,
    escalated: tickets.filter((t) => t.status === "escalated" || t.sla_status === "breached").length,
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <TicketIcon className="h-6 w-6 text-primary" />
            All Support Tickets
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Centralized ticket hub for managing multi-branch customer requests.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadTickets} disabled={loading} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
            <Inbox className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">New Tickets</p>
            <p className="text-2xl font-bold text-foreground">{counts.new}</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">In Progress / Open</p>
            <p className="text-2xl font-bold text-foreground">{counts.open}</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Resolved</p>
            <p className="text-2xl font-bold text-foreground">{counts.resolved}</p>
          </div>
        </div>

        <div className="bg-card p-4 rounded-xl border border-border flex items-center gap-3">
          <div className="p-3 rounded-lg bg-rose-500/10 text-rose-500">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Escalated / Breached</p>
            <p className="text-2xl font-bold text-rose-500">{counts.escalated}</p>
          </div>
        </div>
      </div>

      {/* State Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {[
          { id: "all", label: "All Tickets", count: counts.all, icon: Inbox },
          { id: "new", label: "New", count: counts.new, icon: AlertCircle },
          { id: "open", label: "Open", count: counts.open, icon: Clock },
          { id: "pending", label: "Pending", count: counts.pending, icon: UserPlus },
          { id: "resolved", label: "Resolved", count: counts.resolved, icon: CheckCircle2 },
          { id: "closed", label: "Closed", count: counts.closed, icon: TicketIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TicketTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span className={`ml-1 text-xs px-2 py-0.5 rounded-full ${
                isActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search ticket #, subject, customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="bg-card border border-border rounded-lg text-sm px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            Loading tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-base font-semibold text-foreground">No tickets found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters or tab selection.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 border-b border-border text-xs uppercase font-semibold text-muted-foreground">
                <tr>
                  <th className="py-3.5 px-4">Ticket</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Priority</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Assigned Agent</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTickets.map((ticket) => {
                  const agent = ticket.assigned_agent || ticket.assigned_to;
                  return (
                    <motion.tr
                      key={ticket._id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-medium">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-primary">
                            #{ticket.ticket_number}
                          </span>
                          <span className="text-foreground line-clamp-1 font-semibold">
                            {ticket.title || ticket.subject || "No Subject"}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        <div>
                          <p className="text-foreground font-medium">{ticket.user_id?.name || "Customer"}</p>
                          <p className="text-xs text-muted-foreground">{ticket.user_id?.email || ""}</p>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground border border-border">
                          {ticket.category || "General"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getPriorityBadge(ticket.priority)}`}>
                          {ticket.priority?.toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(ticket.status)}`}>
                          {ticket.status?.replace("_", " ").toUpperCase()}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-muted-foreground">
                        {agent ? (
                          <div className="flex items-center gap-1.5 text-xs text-foreground">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                            {agent.name}
                          </div>
                        ) : (
                          <span className="text-xs text-amber-500 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/branch/tickets/${ticket._id}`)}
                          className="h-8 gap-1 text-primary hover:text-primary hover:bg-primary/10"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
