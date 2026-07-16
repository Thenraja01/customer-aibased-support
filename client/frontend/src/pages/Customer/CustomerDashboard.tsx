import { useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Ticket, Clock, CheckCircle2, ArrowRight, Headphones } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import { useChat } from "@/hooks/useChat";

interface StatCardProps {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number;
  color: string;
}

const StatCard = memo(function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={17} />
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
});

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tickets, loadUserTickets } = useTickets();
  const { chats, loadUserChats } = useChat();

  useEffect(() => {
    if (user?._id) {
      loadUserTickets();
      loadUserChats();
    }
  }, [user, loadUserTickets, loadUserChats]);

  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t: any) => t.status === "resolved").length;

  const openChats = chats.filter((c: any) => c.status === "open").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your support requests and get help.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={Ticket} label="Open Tickets" value={openCount} color="bg-primary/10 text-primary" />
        <StatCard icon={Clock} label="In Progress" value={inProgressCount} color="bg-accent text-accent-foreground" />
        <StatCard icon={CheckCircle2} label="Resolved" value={resolvedCount} color="bg-primary/10 text-primary" />
        <StatCard icon={MessageSquare} label="Open Chats" value={openChats} color="bg-primary/10 text-primary" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <button
          onClick={() => navigate("/chat")}
          className="group flex items-center gap-4 rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 text-left dark:hover:border-primary/20"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
            <MessageSquare size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Chat with Support</p>
            <p className="text-xs text-muted-foreground mt-0.5">Start a conversation with our AI assistant</p>
          </div>
          <ArrowRight size={15} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={() => navigate("/tickets")}
          className="group flex items-center gap-4 rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/10 transition-all duration-300 hover:-translate-y-0.5 text-left dark:hover:border-secondary/20"
        >
          <div className="w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center">
            <Ticket size={18} className="text-secondary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">View Tickets</p>
            <p className="text-xs text-muted-foreground mt-0.5">Manage your support tickets</p>
          </div>
          <ArrowRight size={15} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {chats.length > 0 && (
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] shadow-xs">
          <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent Chats</h3>
            <button
              onClick={() => navigate("/chat")}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="divide-y dark:divide-white/[0.04]">
            {chats.slice(0, 5).map((chat: any) => (
              <div
                key={chat._id}
                className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                onClick={() => navigate("/chat")}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Headphones size={14} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{chat.topic || "Support Chat"}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {new Date(chat.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ml-3 flex-shrink-0 ${
                    chat.status === "open"
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {chat.status === "open" ? "Open" : "Closed"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tickets.length > 0 && (
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] shadow-xs">
          <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center justify-between">
            <h3 className="text-sm font-medium">Recent Tickets</h3>
            <button
              onClick={() => navigate("/tickets")}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </div>
          <div className="divide-y dark:divide-white/[0.04]">
            {tickets.slice(0, 5).map((ticket: any) => (
              <div key={ticket._id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate">{ticket.subject || ticket.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(ticket.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ml-3 flex-shrink-0 ${
                    ticket.status === "open"
                      ? "bg-primary/10 text-primary"
                      : ticket.status === "in_progress"
                      ? "bg-accent text-accent-foreground"
                      : ticket.status === "resolved"
                      ? "bg-primary/10 text-primary"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {ticket.status?.replace("_", " ")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
