import { useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Ticket, Clock, CheckCircle2, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface StatCardProps {
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  label: string;
  value: number;
  accent: string;
}

const StatCard = memo(function StatCard({ icon: Icon, label, value, accent }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-all duration-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-bold ">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center", accent)}>
          <Icon size={16} aria-hidden="true" />
        </div>
      </div>
    </div>
  );
});

export default function CustomerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { tickets, loadUserTickets, loading: ticketsLoading } = useTickets();
  const { chats, loadUserChats, loading: chatsLoading } = useChat();
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      try {
        await Promise.all([loadUserTickets(), loadUserChats()]);
      } catch (error) {
        if (isMounted) {
          toast.error("Error", "Failed to load dashboard data");
        }
      }
    };
    if (user?._id) loadData();
    return () => { isMounted = false; };
  }, [user?._id]);

  const loading = ticketsLoading || chatsLoading;

  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t: any) => t.status === "resolved").length;
  const openChats = chats.filter((c: any) => c.status === "open").length;

  const handleNavigateToChat = useCallback(() => navigate("/chat"), [navigate]);
  const handleNavigateToTickets = useCallback(() => navigate("/tickets"), [navigate]);
  const handleNavigateToChatHistory = useCallback(() => navigate("/chat-history"), [navigate]);
  const handleNavigateToChatWithId = useCallback((chatId: string) => {
    navigate("/chat", { state: { chatId } });
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, chatId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleNavigateToChatWithId(chatId);
    }
  }, [handleNavigateToChatWithId]);

  const formatDate = useCallback((dateString: string) => {
    try { return new Date(dateString).toLocaleDateString(); }
    catch { return "Invalid date"; }
  }, []);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open": return "badge-open";
      case "in_progress": return "badge-in-progress";
      case "waiting_for_customer": return "badge-waiting";
      case "resolved": return "badge-resolved";
      default: return "badge-closed";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold ">
          Welcome back, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your support requests and get help.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16" role="status">
          <Loader2 size={20} className="animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          {/* AI Chat CTA – Primary action */}
          <button
            type="button"
            onClick={handleNavigateToChat}
            className="w-full group flex items-center gap-4 rounded-lg border border-primary/20 bg-primary/[0.04] hover:bg-primary/[0.08] p-5 transition-all duration-200 text-left"
          >
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
              <Sparkles size={20} className="text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Chat with AI Support</p>
              <p className="text-xs text-muted-foreground mt-0.5">Get instant answers from our AI assistant</p>
            </div>
            <ArrowRight size={16} className="text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
          </button>

          {/* Stats */}
          <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={Ticket}
              label="Open Tickets"
              value={openCount}
              accent="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
            />
            <StatCard
              icon={Clock}
              label="In Progress"
              value={inProgressCount}
              accent="bg-blue-500/10 text-blue-600 dark:text-blue-400"
            />
            <StatCard
              icon={CheckCircle2}
              label="Resolved"
              value={resolvedCount}
              accent="bg-primary/10 text-primary"
            />
            <StatCard
              icon={MessageSquare}
              label="Open Chats"
              value={openChats}
              accent="bg-amber-500/10 text-amber-600 dark:text-amber-400"
            />
          </div>

          {/* Quick actions */}
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleNavigateToTickets}
              className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-all duration-200 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <Ticket size={16} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">View Tickets</p>
                <p className="text-xs text-muted-foreground mt-0.5">Track your support requests</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleNavigateToChatHistory}
              className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:border-primary/20 transition-all duration-200 text-left"
            >
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                <MessageSquare size={16} className="text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Chat History</p>
                <p className="text-xs text-muted-foreground mt-0.5">View past conversations</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" aria-hidden="true" />
            </button>
          </div>

          {/* Recent Chats */}
          {chats.length > 0 && (
            <div className="rounded-lg border border-border bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent Chats</h2>
                <button
                  type="button"
                  onClick={handleNavigateToChatHistory}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-border" role="list">
                {chats.slice(0, 5).map((chat: any) => (
                  <div
                    key={chat._id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => handleNavigateToChatWithId(chat._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, chat._id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={13} className="text-primary" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium truncate">{chat.topic || "Support Chat"}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(chat.created_at)}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md ml-3 shrink-0",
                      chat.status === "open" ? "badge-open" : "badge-closed"
                    )}>
                      {chat.status === "open" ? "Open" : "Closed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Tickets */}
          {tickets.length > 0 && (
            <div className="rounded-lg border border-border bg-card">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-semibold">Recent Tickets</h2>
                <button
                  type="button"
                  onClick={handleNavigateToTickets}
                  className="text-xs text-primary hover:underline font-medium"
                >
                  View all
                </button>
              </div>
              <div className="divide-y divide-border" role="list">
                {tickets.slice(0, 5).map((ticket: any) => (
                  <div
                    key={ticket._id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
                    role="listitem"
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium truncate">{ticket.subject || ticket.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(ticket.created_at)}</p>
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md ml-3 shrink-0",
                      getStatusStyle(ticket.status)
                    )}>
                      {ticket.status?.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}