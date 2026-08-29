import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Ticket, Clock, CheckCircle2, AlertCircle, RotateCcw, Search } from "lucide-react";
import { TicketAPI } from "@/api";

const statusFilters = ["", "open", "in_progress", "pending", "resolved", "closed"];

export default function SupportTicketsPage() {
  const navigate = useNavigate();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setLoading(true);
    TicketAPI.getAll({}).then((res) => {
      if (res.data.success) setTickets(res.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = tickets.filter((t) => {
    if (statusFilter && t.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return t.subject?.toLowerCase().includes(q) || t._id?.includes(q);
    }
    return true;
  });

  const handleStatusUpdate = async (ticket: any, action: string) => {
    try {
      if (action === "resolve") await TicketAPI.resolve(ticket._id);
      else if (action === "close") await TicketAPI.close(ticket._id);
      else if (action === "pending") await TicketAPI.setPending(ticket._id);
      else if (action === "reopen") await TicketAPI.reopen(ticket._id);
      const res = await TicketAPI.getAll({});
      if (res.data.success) setTickets(res.data.data || []);
    } catch {}
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-primary/10 text-primary";
      case "in_progress": return "bg-accent text-accent-foreground";
      case "pending": return "bg-amber-500/10 text-amber-600";
      case "resolved": return "bg-green-500/10 text-green-600";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "bg-destructive/10 text-destructive";
      case "high": return "bg-orange-500/10 text-orange-600";
      case "medium": return "bg-primary/10 text-primary";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold ">Tickets</h1>
        <p className="text-sm text-muted-foreground">Manage support tickets</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-4 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {statusFilters.map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                statusFilter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card shadow-xs">
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            Loading tickets...
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12">
            <Ticket size={40} className="mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-sm font-medium text-muted-foreground">No tickets found</p>
          </div>
        ) : (
          <div className="divide-y">
            {filtered.map((ticket) => (
              <div key={ticket._id}
                className="px-4 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/support/tickets/${ticket._id}`)}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div>
                    {ticket.status === "open" ? <AlertCircle size={14} className="text-primary" /> :
                     ticket.status === "in_progress" ? <Clock size={14} className="text-accent-foreground" /> :
                     ticket.status === "pending" ? <Clock size={14} className="text-amber-500" /> :
                     ticket.status === "resolved" ? <CheckCircle2 size={14} className="text-green-500" /> :
                     <Ticket size={14} className="text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{ticket.subject}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString()}</span>
                      {ticket.user_id?.name && (
                        <span className="text-xs text-muted-foreground">by {ticket.user_id.name}</span>
                      )}
                      {ticket.category && (
                        <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">{ticket.category}</span>
                      )}
                      {ticket.priority && (
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getPriorityColor(ticket.priority)}`}>
                          {ticket.priority}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${getStatusColor(ticket.status)}`}>
                    {ticket.status?.replace("_", " ")}
                  </span>
                  {ticket.status === "open" && (
                    <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ticket, "pending"); }}
                      className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-500" title="Set pending">
                      <Clock size={14} />
                    </button>
                  )}
                  {(ticket.status === "open" || ticket.status === "in_progress" || ticket.status === "pending") && (
                    <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ticket, "resolve"); }}
                      className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-500" title="Resolve">
                      <CheckCircle2 size={14} />
                    </button>
                  )}
                  {(ticket.status === "resolved" || ticket.status === "closed") && (
                    <button onClick={(e) => { e.stopPropagation(); handleStatusUpdate(ticket, "reopen"); }}
                      className="p-1.5 rounded-lg hover:bg-primary/10 text-primary" title="Reopen">
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
