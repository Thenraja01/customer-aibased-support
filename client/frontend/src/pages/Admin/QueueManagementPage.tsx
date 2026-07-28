import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Zap, Clock, CheckCircle2 } from "lucide-react";
import { TicketAPI } from "@/api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

export default function QueueManagementPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [data, setData] = useState<{ queue: any[]; workload: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);

  const loadQueue = () => {
    setLoading(true);
    TicketAPI.getQueue()
      .then((res) => { if (res.data.success) setData(res.data.data); })
      .catch(() => toast.error("Error", "Failed to load queue"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadQueue(); }, []);

  const handleSmartAssign = async (ticketId: string) => {
    setAssigning(ticketId);
    try {
      await TicketAPI.smartAssign(ticketId);
      loadQueue();
    } catch {
      toast.error("Error", "Failed to assign");
    } finally {
      setAssigning(null);
    }
  };

  const handleClose = async (ticketId: string) => {
    setClosing(ticketId);
    try {
      await TicketAPI.close(ticketId);
      loadQueue();
    } catch {
      toast.error("Error", "Failed to close ticket");
    } finally {
      setClosing(null);
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "critical": return "bg-destructive/10 text-destructive";
      case "high": return "bg-orange-500/10 text-orange-600 dark:text-orange-400";
      case "medium": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "low": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hrs = Math.floor(diff / 3600000);
    if (hrs < 1) return `${Math.floor(diff / 60000)}m`;
    if (hrs < 24) return `${hrs}h`;
    return `${Math.floor(hrs / 24)}d`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Queue Management</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage ticket queue and smart assignment</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {data?.workload?.map((agent: any) => (
          <div key={agent._id} className="rounded-xl border bg-card p-4">
            <p className="text-sm font-medium truncate">{agent.name}</p>
            <p className="text-xs text-muted-foreground truncate">{agent.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={cn("text-lg font-bold", agent.openTickets > 5 ? "text-destructive" : agent.openTickets > 2 ? "text-amber-500" : "text-green-500")}>
                {agent.openTickets}
              </span>
              <span className="text-xs text-muted-foreground">open tickets</span>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl border bg-card">
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <h2 className="text-sm font-semibold">Ticket Queue ({data?.queue?.length || 0})</h2>
          <button onClick={loadQueue} className="text-xs text-primary hover:underline">Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Subject</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Customer</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Priority</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Age</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Assigned To</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.queue?.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No tickets in queue</td></tr>
              ) : (
                data?.queue?.map((ticket: any) => (
                  <tr key={ticket._id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4 text-muted-foreground text-xs font-mono">#{ticket._id?.slice(-6)}</td>
                    <td className="py-3 px-4 font-medium max-w-[200px] truncate">
                      <button onClick={() => navigate(`/support/tickets/${ticket._id}`)} className="hover:text-primary transition-colors">
                        {ticket.subject}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{ticket.user_id?.name || "—"}</td>
                    <td className="py-3 px-4">
                      <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded", priorityColor(ticket.priority))}>
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 capitalize text-muted-foreground">{ticket.status.replace("_", " ")}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock size={12} />
                        <span className="text-xs">{timeAgo(ticket.created_at)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{ticket.assigned_to?.name || "—"}</td>
                    <td className="py-3 px-4 text-right">
                      {!ticket.assigned_to ? (
                        <button
                          onClick={() => handleSmartAssign(ticket._id)}
                          disabled={assigning === ticket._id}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
                        >
                          {assigning === ticket._id ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
                          Assign
                        </button>
                      ) : ticket.status !== "resolved" && ticket.status !== "closed" ? (
                        <button
                          onClick={() => handleClose(ticket._id)}
                          disabled={closing === ticket._id}
                          className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50 transition-colors"
                        >
                          {closing === ticket._id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                          Close
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground capitalize">{ticket.status}</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
