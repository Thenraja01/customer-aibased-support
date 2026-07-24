import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Clock, CheckCircle2, AlertCircle, Plus, ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import CreateTicketDialog from "@/components/ticket/CreateTicketDialog";

const statusFilters = ["", "open", "in_progress", "waiting_for_customer", "resolved", "closed"];

export default function TicketsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tickets, loading, loadUserTickets, loadAllTickets } = useTickets();

  const [statusFilter, setStatusFilter] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const isSupport = user?.role_id?.role_name === "support";

  useEffect(() => {
    if (isSupport) {
      loadAllTickets();
    } else if (user?._id) {
      loadUserTickets();
    }
  }, [isSupport, user, loadAllTickets, loadUserTickets]);

  const filteredTickets = statusFilter
    ? tickets.filter((t: any) => t.status === statusFilter)
    : tickets;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <AlertCircle size={14} className="text-primary" />;
      case "in_progress":
        return <Clock size={14} className="text-blue-500" />;
      case "waiting_for_customer":
        return <Clock size={14} className="text-amber-500" />;
      case "resolved":
        return <CheckCircle2 size={14} className="text-primary" />;
      default:
        return <Ticket size={14} className="text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-primary/10 text-primary";
      case "in_progress":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "waiting_for_customer":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "resolved":
        return "bg-primary/10 text-primary";
      case "closed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          {!isSupport && (
            <button
              onClick={() => navigate("/dashboard")}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tickets</h1>
            <p className="text-muted-foreground">
              {isSupport ? "Manage all support tickets" : "View and track your support tickets"}
            </p>
          </div>
        </div>
        {!isSupport && (
          <button
            onClick={() => setShowCreateDialog(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <Plus size={16} />
            New Ticket
          </button>
        )}
      </div>

      <div className="flex gap-1">
        {statusFilters.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] shadow-xs">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading tickets...
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="text-center py-12">
            <Ticket size={40} className="mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No tickets found</p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {statusFilter ? "No tickets with this status" : "No tickets yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04]">
            {filteredTickets.map((ticket: any) => (
              <div
                key={ticket._id}
                onClick={() => navigate(`/tickets/${ticket._id}`)}
                className="px-4 py-4 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {getStatusIcon(ticket.status)}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ticket.subject || ticket.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                      {ticket.description}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      {ticket.priority && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                          ticket.priority === "urgent"
                            ? "bg-destructive/10 text-destructive"
                            : ticket.priority === "high"
                            ? "bg-secondary/10 text-secondary"
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {ticket.priority}
                        </span>
                      )}
                      {isSupport && ticket.user_id?.name && (
                        <span className="text-[11px] text-muted-foreground">
                          by {ticket.user_id.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-md ml-3 flex-shrink-0 ${getStatusColor(
                    ticket.status
                  )}`}
                >
                  {ticket.status?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateTicketDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
      />
    </div>
  );
}
