import { useEffect, memo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Ticket, Clock, CheckCircle2, ArrowRight, Headphones, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTickets } from "@/hooks/useTickets";
import { useChat } from "@/hooks/useChat";
import { useToast } from "@/components/ui/toast";

interface StatCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  color: string;
}

const StatCard = memo(function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-4 sm:p-6 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon size={17} className="shrink-0" aria-hidden="true" />
        </div>
        <div>
          <p className="text-xl sm:text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
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

  // Load data on mount with proper error handling
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

    if (user?._id) {
      loadData();
    }

    return () => {
      isMounted = false;
    };
  }, [user?._id]); // Only depend on user ID, not the functions

  const loading = ticketsLoading || chatsLoading;

  // Memoized calculations to prevent recalculations on every render
  const openCount = tickets.filter((t: any) => t.status === "open").length;
  const inProgressCount = tickets.filter((t: any) => t.status === "in_progress").length;
  const resolvedCount = tickets.filter((t: any) => t.status === "resolved").length;
  const openChats = chats.filter((c: any) => c.status === "open").length;

  // Stable navigation handlers
  const handleNavigateToChat = useCallback(() => {
    navigate("/chat/");
  }, [navigate]);

  const handleNavigateToTickets = useCallback(() => {
    navigate("/tickets");
  }, [navigate]);

  const handleNavigateToChatHistory = useCallback(() => {
    navigate("/chat-history");
  }, [navigate]);

  const handleNavigateToChatWithId = useCallback((chatId: string) => {
    navigate("/chat/", { state: { chatId } });
  }, [navigate]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, chatId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleNavigateToChatWithId(chatId);
    }
    if (e.key === " ") {
      e.preventDefault();
      handleNavigateToChatWithId(chatId);
    }
  }, [handleNavigateToChatWithId]);

  const formatDate = useCallback((dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return "Invalid date";
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">
          Welcome back, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-sm text-muted-foreground">Manage your support requests and get help.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12" role="status">
          <Loader2 size={20} className="animate-spin text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Loading dashboard data...</span>
        </div>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              icon={Ticket} 
              label="Open Tickets" 
              value={openCount} 
              color="bg-primary/10 text-primary" 
            />
            <StatCard 
              icon={Clock} 
              label="In Progress" 
              value={inProgressCount} 
              color="bg-accent text-accent-foreground" 
            />
            <StatCard 
              icon={CheckCircle2} 
              label="Resolved" 
              value={resolvedCount} 
              color="bg-primary/10 text-primary" 
            />
            <StatCard 
              icon={MessageSquare} 
              label="Open Chats" 
              value={openChats} 
              color="bg-primary/10 text-primary" 
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleNavigateToChat}
              className="group flex items-center gap-4 rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center shrink-0">
                <MessageSquare size={18} className="text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">Chat with Support</p>
                <p className="text-xs text-muted-foreground mt-0.5">Start a conversation with our AI assistant</p>
              </div>
              <ArrowRight size={15} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleNavigateToTickets}
              className="group flex items-center gap-4 rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <div className="w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center shrink-0">
                <Ticket size={18} className="text-secondary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">View Tickets</p>
                <p className="text-xs text-muted-foreground mt-0.5">Manage your support tickets</p>
              </div>
              <ArrowRight size={15} className="text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" aria-hidden="true" />
            </button>
          </div>

          {chats.length > 0 && (
            <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] shadow-xs">
              <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center justify-between">
                <h2 className="text-sm font-medium">Recent Chats</h2>
                <button 
                  type="button"
                  onClick={handleNavigateToChatHistory} 
                  className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  View all
                </button>
              </div>
              <div className="divide-y dark:divide-white/[0.04]" role="list">
                {chats.slice(0, 5).map((chat: any) => (
                  <div
                    key={chat._id}
                    className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => handleNavigateToChatWithId(chat._id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => handleKeyDown(e, chat._id)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <Headphones size={14} className="text-primary" aria-hidden="true" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{chat.topic || "Support Chat"}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(chat.created_at)}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ml-3 shrink-0 ${
                      chat.status === "open" 
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-muted text-muted-foreground"
                    }`}>
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
                <h2 className="text-sm font-medium">Recent Tickets</h2>
                <button 
                  type="button"
                  onClick={handleNavigateToTickets} 
                  className="text-xs text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  View all
                </button>
              </div>
              <div className="divide-y dark:divide-white/[0.04]" role="list">
                {tickets.slice(0, 5).map((ticket: any) => {
                  const statusColor = 
                    ticket.status === "open" 
                      ? "bg-primary/10 text-primary" 
                      : ticket.status === "in_progress" 
                        ? "bg-accent text-accent-foreground" 
                        : ticket.status === "resolved" 
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" 
                          : "bg-muted text-muted-foreground";
                  return (
                    <div 
                      key={ticket._id} 
                      className="px-4 py-3 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors"
                      role="listitem"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium truncate">{ticket.subject || ticket.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{formatDate(ticket.created_at)}</p>
                      </div>
                      <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-md ml-3 shrink-0 ${statusColor}`}>
                        {ticket.status?.replace("_", " ")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}