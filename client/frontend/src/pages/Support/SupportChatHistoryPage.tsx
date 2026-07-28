import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChatAPI } from "@/api";
import { MessageSquare, Clock, Eye, Search, Loader2, User } from "lucide-react";
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
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Chat History</h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all customer conversations across your organization.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by topic, customer name, or email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="all">All Status</option>
          <option value="open">Open</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
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
                          {chat.user_id?.name || "Unknown"}
                        </p>
                      </div>
                      <span className="text-muted-foreground">·</span>
                      <Clock size={12} className="text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        {new Date(chat.created_at).toLocaleString()}
                      </p>
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatusColor(chat.status)}`}
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
