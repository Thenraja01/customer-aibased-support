import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChatAPI } from "@/api";
import { MessageSquare, Clock, Eye, Search, Loader2, User, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface Chat {
  _id: string;
  topic: string;
  status: string;
  created_at: string;
  user_id?: { _id: string; name: string; email: string };
}

export default function SupportChatHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);
  const [closingAll, setClosingAll] = useState(false);

  useEffect(() => {
    loadChats();
  }, [user]);

  const loadChats = async () => {
    if (!user?._id) return;
    setLoading(true);
    try {
      const res = await ChatAPI.getAll();
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch {
      toast.error("Error", "Failed to load chat history.");
    } finally {
      setLoading(false);
    }
  };

  const handleCloseAll = useCallback(async () => {
    setConfirmCloseAll(false);
    setClosingAll(true);
    try {
      await ChatAPI.closeAll();
      toast.success("Closed All", "All active customer chat sessions have been closed.");
      loadChats();
    } catch {
      toast.error("Error", "Failed to close active chat sessions.");
    } finally {
      setClosingAll(false);
    }
  }, [toast]);

  const filtered = chats.filter((c) => {
    const matchesSearch =
      !search ||
      c.topic?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_id?.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 font-semibold";
      case "escalated":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 font-bold animate-pulse";
      case "in_progress":
        return "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400 font-semibold";
      case "closed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Loading chat history...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold ">Chat History</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all customer conversations across your organization.
          </p>
        </div>
        <div>
          {confirmCloseAll ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Close all open chats?</span>
              <button onClick={() => setConfirmCloseAll(false)} className="px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
              <button onClick={handleCloseAll} disabled={closingAll} className="px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/20 hover:bg-amber-500/30 rounded-md transition-colors">
                {closingAll ? <Loader2 size={12} className="animate-spin" /> : "Confirm"}
              </button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmCloseAll(true)} disabled={closingAll || chats.length === 0} className="gap-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
              <XCircle size={15} />
              Close All
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex items-center gap-1.5 p-1 bg-muted rounded-xl border w-full sm:w-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              statusFilter === "all" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All History
          </button>
          <button
            onClick={() => setStatusFilter("escalated")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              statusFilter === "escalated" ? "bg-amber-500 text-black shadow-sm" : "text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
            }`}
          >
            ⚡ Live Human Handoffs
          </button>
          <button
            onClick={() => setStatusFilter("open")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              statusFilter === "open" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            🤖 AI Bot Sessions
          </button>
        </div>

        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic, customer name, or email..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card overflow-hidden">
        {chats.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No chat history yet.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conversations will appear here once customers start chatting.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Search size={36} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">
              No conversations match "{search}"
            </p>
            <button
              onClick={() => { setSearch(""); setStatusFilter("all"); }}
              className="text-sm text-primary hover:underline mt-2"
            >
              Clear filters
            </button>
          </div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04]">
            {filtered.map((chat) => (
              <div
                key={chat._id}
                className="px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-muted/50 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">
                      {chat.topic || "Support Chat"}
                    </p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <div className="flex items-center gap-1">
                        <User size={11} className="text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">
                          {chat.user_id?.name || "Unknown Customer"}
                        </p>
                      </div>
                      <span className="text-muted-foreground">·</span>
                      <Clock size={12} className="text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {new Date(chat.created_at).toLocaleString()}
                      </p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-muted text-foreground border">
                        {chat.status === "CONVERTED_TO_TICKET" || chat.ticket_id
                          ? "AI → Human Chat → Ticket"
                          : chat.is_escalated || chat.status === "escalated" || chat.status === "HUMAN_ACTIVE"
                          ? "AI → Human Chat"
                          : "AI Session"}
                      </span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${getStatusColor(chat.status)}`}
                      >
                        {chat.status}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/support/chat/${chat._id}`)}
                  className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
                  aria-label="View conversation"
                >
                  <Eye size={16} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          Showing {filtered.length} of {chats.length} conversations
        </p>
      )}
    </div>
  );
}
