import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalChat } from "@/context/ChatContext";
import { MessageSquare, Clock, Trash2, Eye, Search, Loader2, Plus, Ticket, Calendar, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { ChatAPI } from "@/api/chat.api";

export default function ChatHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const { chats, loading, loadUserChats, deleteChat } = useGlobalChat();
  
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);
  const [closingAll, setClosingAll] = useState(false);

  useEffect(() => {
    if (user?._id) {
      loadUserChats();
    }
  }, [user?._id, loadUserChats]);

  const handleCloseAll = useCallback(async () => {
    setConfirmCloseAll(false);
    setClosingAll(true);
    try {
      await ChatAPI.closeAll();
      toast.success("Closed All", "All your active chat sessions have been closed.");
      loadUserChats();
    } catch {
      toast.error("Error", "Failed to close active chat sessions.");
    } finally {
      setClosingAll(false);
    }
  }, [loadUserChats, toast]);

  const handleDelete = useCallback(async (chatId: string) => {
    setDeleting(chatId);
    try {
      await deleteChat(chatId);
      toast.success("Chat Deleted", "The conversation has been removed.");
    } catch {
      toast.error("Error", "Failed to delete chat. Please try again.");
    } finally {
      setDeleting(null);
      setConfirmDelete(null);
    }
  }, [deleteChat, toast]);

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    return chats.filter((c) => c.topic?.toLowerCase().includes(search.toLowerCase()));
  }, [chats, search]);

  const groupedChats = useMemo(() => {
    const today: any[] = [];
    const yesterday: any[] = [];
    const previous7Days: any[] = [];
    const older: any[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const yesterdayStart = todayStart - 86400000;
    const sevenDaysStart = todayStart - (6 * 86400000);

    filtered.forEach((c) => {
      const created = new Date(c.created_at || c.createdAt).getTime();
      if (created >= todayStart) {
        today.push(c);
      } else if (created >= yesterdayStart) {
        yesterday.push(c);
      } else if (created >= sevenDaysStart) {
        previous7Days.push(c);
      } else {
        older.push(c);
      }
    });

    return [
      { groupName: "Today", items: today },
      { groupName: "Yesterday", items: yesterday },
      { groupName: "Previous 7 Days", items: previous7Days },
      { groupName: "Older", items: older },
    ].filter((g) => g.items.length > 0);
  }, [filtered]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "closed":
        return "bg-muted text-muted-foreground border border-border";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20" role="status">
        <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
          <Loader2 size={16} className="animate-spin text-primary" />
          Loading conversation history...
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Chat History</h1>
          <p className="text-sm text-muted-foreground mt-1">Review, search, or reopen past sessions with your AI Copilot.</p>
        </div>
        <div className="flex items-center gap-2">
          {confirmCloseAll ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Close all open sessions?</span>
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
          <Button onClick={() => navigate("/chat")} size="sm" className="gap-2 shadow-sm">
            <Plus size={16} />
            Start New Chat
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search conversations by topic or query..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-card border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all shadow-2xs"
          aria-label="Search conversations"
        />
      </div>

      {chats.length === 0 ? (
        <div className="p-8 sm:p-12 text-center border rounded-2xl bg-card">
          <MessageSquare size={44} className="mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="text-base font-bold text-foreground">No chat history yet</h3>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Start your first AI Copilot session to view transcript archives.</p>
          <Button onClick={() => navigate("/chat")} className="gap-2">
            <Plus size={16} />
            Start Your First Chat
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 text-center border rounded-2xl bg-card">
          <Search size={36} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-sm text-muted-foreground font-medium">No conversations match "{search}"</p>
          <button onClick={() => setSearch("")} className="text-xs text-primary font-semibold hover:underline mt-2">
            Clear search filter
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedChats.map((group) => (
            <div key={group.groupName} className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground px-1">
                <Calendar size={13} className="text-primary" />
                <span>{group.groupName}</span>
                <span className="text-[10.5px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {group.items.length}
                </span>
              </div>

              <div className="rounded-2xl border bg-card border-border overflow-hidden divide-y divide-border/60 shadow-2xs">
                {group.items.map((chat: any) => (
                  <div key={chat._id} className="px-4 sm:px-6 py-3.5 flex items-center justify-between hover:bg-muted/40 transition-colors gap-3 group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                        <MessageSquare size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {chat.topic || "Enterprise AI Session"}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock size={11} />
                            {new Date(chat.created_at || chat.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${getStatusColor(chat.status)}`}>
                            {chat.status}
                          </span>

                          {chat.ticket_id && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Ticket size={10} /> Escalated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {confirmDelete === chat._id ? (
                        <div className="flex items-center gap-1.5">
                          <button onClick={() => setConfirmDelete(null)} className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded-lg">Cancel</button>
                          <button onClick={() => handleDelete(chat._id)} className="px-2 py-1 text-xs text-rose-500 hover:bg-rose-500/10 rounded-lg font-semibold">
                            {deleting === chat._id ? <Loader2 size= {12} className="animate-spin" /> : "Confirm Delete"}
                          </button>
                        </div>
                      ) : (
                        <>
                          <button onClick={() => navigate(`/chat-history/${chat._id}`)} className="p-2 hover:bg-primary/10 hover:text-primary rounded-xl text-muted-foreground transition-colors" aria-label="View conversation" title="View Transcript">
                            <Eye size={16} />
                          </button>
                          <button onClick={() => setConfirmDelete(chat._id)} className="p-2 hover:bg-rose-500/10 hover:text-rose-500 rounded-xl text-muted-foreground transition-colors" aria-label="Delete conversation" title="Delete Session">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

