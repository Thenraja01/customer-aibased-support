import React from "react";
import { Ticket, ArrowUpRight, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

interface TicketContextPanelProps {
  ticket?: any;
  conversationId?: string;
  onConvertToTicket?: () => void;
  canConvertToTicket?: boolean;
}

export const TicketContextPanel: React.FC<TicketContextPanelProps> = ({
  ticket,
  conversationId,
  onConvertToTicket,
  canConvertToTicket = true,
}) => {
  if (!ticket) {
    return (
      <div className="p-4 bg-card border rounded-2xl space-y-3 shadow-sm text-xs">
        <div className="flex items-center gap-2 font-bold text-sm">
          <Ticket size={16} className="text-muted-foreground" />
          <span>Ticket Status</span>
        </div>
        <p className="text-muted-foreground">
          This conversation is currently a <strong>Live Chat Session</strong> and has not been converted to a formal ticket.
        </p>
        {canConvertToTicket && onConvertToTicket && (
          <Button
            onClick={onConvertToTicket}
            size="sm"
            className="w-full text-xs font-bold gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
          >
            <Ticket size={14} />
            Convert to Ticket (#TK-NEW)
          </Button>
        )}
      </div>
    );
  }

  const ticketNumber = ticket.ticket_number || ticket.ticketNumber || ticket._id?.slice(-6) || "1024";
  const ticketStatus = ticket.status || "open";
  const ticketPriority = ticket.priority || "medium";
  const assigneeName = ticket.assignedTo?.name || ticket.assigned_to?.name || "Unassigned";

  return (
    <div className="p-4 bg-card border rounded-2xl space-y-3 shadow-sm text-xs">
      <div className="flex items-center justify-between gap-2 border-b pb-2">
        <div className="flex items-center gap-2 font-bold text-sm text-primary">
          <Ticket size={16} />
          <span>Ticket #{ticketNumber}</span>
        </div>
        <Badge
          className={`capitalize font-semibold ${
            ticketStatus === "resolved" || ticketStatus === "closed"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-600 border-amber-500/30"
          }`}
          variant="outline"
        >
          {ticketStatus}
        </Badge>
      </div>

      <div className="space-y-2 text-xs">
        <div className="flex items-center justify-between text-muted-foreground">
          <span>Priority</span>
          <Badge variant="outline" className="capitalize font-bold text-[10px]">
            {ticketPriority}
          </Badge>
        </div>

        <div className="flex items-center justify-between text-muted-foreground">
          <span>Assignee</span>
          <span className="font-semibold text-foreground">{assigneeName}</span>
        </div>

        <div className="bg-muted/40 p-2 rounded-xl text-[11px] space-y-0.5">
          <span className="font-bold text-muted-foreground uppercase text-[9px]">Subject</span>
          <p className="font-medium text-foreground truncate">{ticket.subject || ticket.title || "Support Handoff Ticket"}</p>
        </div>
      </div>

      <Link to={`/support/tickets/${ticket._id}`}>
        <Button variant="outline" size="sm" className="w-full text-xs font-semibold gap-1.5 mt-1">
          <span>View Ticket Details</span>
          <ArrowUpRight size={13} />
        </Button>
      </Link>
    </div>
  );
};
