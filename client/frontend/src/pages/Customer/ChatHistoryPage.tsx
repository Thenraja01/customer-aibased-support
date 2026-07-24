import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChatAPI } from "@/api";
import { MessageSquare, Clock, Trash2, Eye, Search, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

interface Chat {
  _id: string;
  topic: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ChatHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, [user]);

  const loadChats = async () => {
    if (!user?._id) return;
    setLoading(true);
    setError("");
    try {
      const res = await ChatAPI.getByUser(user._id);
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch {
      setError("Failed to load chat history. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = useCallback(async (chatId: string) => {
    setDeleting(chatId);
    try {
      await ChatAPI.delete(chatId);
      setChats((prev) => prev.filter((chat) => chat._id !== chatId));
      toast.success("Chat Deleted", "The conversation has been removed.");
    } catch {
      toast.error("Error", "Failed to delete chat. Please try again.");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }, [toast]);

  const filtered = search
    ? chats.filter((c) => c.topic?.toLowerCase().includes(search.toLowerCase()))
    : chats;

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
      <div className="flex items-center justify-center py-20" role="status">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 size={16} className="animate-spin" />
          Loading chat history...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chat History</h1>
          <p className="text-sm text-muted-foreground mt-1">View and manage your past conversations with the AI assistant.</p>
        </div>
        <Button onClick={() => navigate("/chat")} size="sm">Start New Chat</Button>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive flex items-center gap-2" role="alert">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background dark:bg-card/50 dark:border-white/[0.06] text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          aria-label="Search conversations"
        />
      </div>

      <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
        {chats.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <MessageSquare size={48} className="mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">No chat history yet.</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">Start a conversation with the AI assistant.</p>
            <Button onClick={() => navigate("/chat")}>Start Your First Chat</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 sm:p-12 text-center">
            <Search size={36} className="mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No conversations match "{search}"</p>
            <button onClick={() => setSearch("")} className="text-sm text-primary hover:underline mt-2">Clear search</button>
          </div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04]">
            {filtered.map((chat) => (
              <div key={chat._id} className="px-4 sm:px-6 py-4 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{chat.topic || "Support Chat"}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Clock size={12} className="text-muted-foreground shrink-0" />
                      <p className="text-xs text-muted-foreground">{new Date(chat.created_at).toLocaleString()}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${getStatusColor(chat.status)}`}>{chat.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {confirmDelete === chat._id ? (
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
                      <button onClick={() => handleDelete(chat._id)} className="px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded-md font-medium">
                        {deleting === chat._id ? <Loader2 size={12} className="animate-spin" /> : "Delete"}
                      </button>
                    </div>
                  ) : (
                    <>
                      <button onClick={() => navigate(`/chat-history/${chat._id}`)} className="p-2 hover:bg-muted rounded-lg transition-colors" aria-label="View conversation"><Eye size={16} className="text-muted-foreground" /></button>
                      <button onClick={() => setConfirmDelete(chat._id)} className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" aria-label="Delete conversation"><Trash2 size={16} className="text-destructive" /></button>
                    </>
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
