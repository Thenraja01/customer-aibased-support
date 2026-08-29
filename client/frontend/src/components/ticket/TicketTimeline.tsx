import { CheckCircle2, Clock, MessageSquare, PlayCircle, XCircle, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TicketTimelineProps {
  ticket: any;
  messages: any[];
}

export function TicketTimeline({ ticket, messages }: TicketTimelineProps) {
  const events: Array<{
    id: string;
    title: string;
    date: string;
    icon: React.ComponentType<any>;
    color: string;
    active: boolean;
  }> = [
    {
      id: "created",
      title: "Ticket Created",
      date: new Date(ticket.created_at).toLocaleString(),
      icon: Plus,
      color: "bg-blue-500",
      active: true,
    },
  ];

  if (ticket.assigned_to) {
    events.push({
      id: "assigned",
      title: `Assigned to ${ticket.assigned_to.name || "Support"}`,
      date: new Date(ticket.updated_at).toLocaleString(), // Fallback date
      icon: Clock,
      color: "bg-purple-500",
      active: true,
    });
  }

  if (ticket.status === "in_progress") {
    events.push({
      id: "in_progress",
      title: "In Progress",
      date: new Date(ticket.updated_at).toLocaleString(),
      icon: PlayCircle,
      color: "bg-amber-500",
      active: true,
    });
  }

  if (ticket.status === "resolved") {
    events.push({
      id: "resolved",
      title: "Resolved",
      date: new Date(ticket.updated_at).toLocaleString(),
      icon: CheckCircle2,
      color: "bg-green-500",
      active: true,
    });
  }

  if (ticket.status === "closed") {
    events.push({
      id: "closed",
      title: "Closed",
      date: new Date(ticket.updated_at).toLocaleString(),
      icon: XCircle,
      color: "bg-gray-500",
      active: true,
    });
  }

  return (
    <div className="py-4">
      <h3 className="text-sm font-semibold mb-4">Ticket Timeline</h3>
      <div className="relative border-l border-border ml-3 space-y-6">
        {events.map((event) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="relative pl-6">
              <div
                className={cn(
                  "absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-background",
                  event.color,
                  "text-white"
                )}
              >
                <Icon size={12} />
              </div>
              <div>
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-xs text-muted-foreground">{event.date}</p>
              </div>
            </div>
          );
        })}
        {Array.isArray(messages) && messages.length > 0 && (
          <div className="relative pl-6">
            <div
              className={cn(
                "absolute -left-[13px] top-1 flex h-6 w-6 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground"
              )}
            >
              <MessageSquare size={12} />
            </div>
            <div>
              <p className="text-sm font-medium">{messages.length} Messages</p>
              <p className="text-xs text-muted-foreground">Latest: {new Date(messages[messages.length - 1].created_at).toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

