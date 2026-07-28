import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Trash2, MessageSquare, ChevronLeft,
  ChevronRight, Eye, X, Filter, Loader2, User,
  Calendar, Building2, Download
} from "lucide-react";
import { AdminAPI } from "@/api/admin.api";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

interface ChatRecord {
  _id: string;
  user_id: { _id: string; name: string; email: string };
  organization_id: { _id: string; name: string };
  topic: string;
  status: "open" | "closed";
  messageCount: number;
  created_at: string;
  updated_at: string;
}

interface ChatMessage {
  _id: string;
  sender_id: { _id: string; name: string; email: string };
  content: string;
  message_type: string;
  is_ai: boolean;
  created_at: string;
}

interface ChatDetail {
  _id: string;
  user_id: { _id: string; name: string; email: string };
  organization_id: { _id: string; name: string };
  topic: string;
  status: "open" | "closed";
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ChatHistoryManagementPage() {
  const toast = useToast();
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [users, setUsers] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [page, setPage] = useState(1);
  const [selectedChat, setSelectedChat] = useState<ChatDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmEndId, setConfirmEndId] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [exporting, setExporting] = useState(false);
  const limit = 10;

  const fetchUsers = useCallback(async () => {
    try {
      const res = await AdminAPI.getUsersBasic();
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch { }
  }, []);

  const fetchChats = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { page, limit };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      if (userIdFilter) params.userId = userIdFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      const res = await AdminAPI.getChats(params);
      if (res.data.success) {
        setChats(res.data.data);
        setPagination(res.data.pagination);
      }
    } catch { } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, userIdFilter, dateFrom, dateTo]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchChats();
  }, [fetchChats]);

  const handleViewChat = async (chatId: string) => {
    setLoadingDetail(true);
    setSelectedChat(null);
    try {
      const res = await AdminAPI.getChatDetail(chatId);
      if (res.data.success) {
        setSelectedChat(res.data.data);
      }
    } catch { } finally {
      setLoadingDetail(false);
    }
  };

  const handleDelete = async (chat: ChatRecord) => {
    setConfirmDeleteId(null);
    try {
      await AdminAPI.deleteChat(chat._id);
      if (selectedChat?._id === chat._id) setSelectedChat(null);
      toast.success("Chat Deleted", `"${chat.topic}" and all messages removed.`);
      fetchChats();
    } catch {
      toast.error("Error", "Failed to delete chat.");
    }
  };

  const handleEndChat = async (chatId: string) => {
    setConfirmEndId(null);
    try {
      const res = await AdminAPI.updateChatStatus(chatId, "closed");
      if (res.data.success) {
        if (selectedChat && selectedChat._id === chatId) {
          setSelectedChat({ ...selectedChat, status: "closed" });
        }
        setChats(chats.map((c) => (c._id === chatId ? { ...c, status: "closed" } : c)));
        toast.success("Chat Ended", "Chat has been closed.");
      }
    } catch {
      toast.error("Error", "Failed to end chat.");
    }
  };

  const buildFilterParams = () => {
    const params: any = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (userIdFilter) params.userId = userIdFilter;
    if (dateFrom) params.from = dateFrom;
    if (dateTo) params.to = dateTo;
    return params;
  };

  const handleDeleteAll = async () => {
    setConfirmDeleteAll(false);
    const count = pagination?.total ?? chats.length;
    if (count === 0) return;
    setDeletingAll(true);
    try {
      const res = await AdminAPI.deleteAllChats(buildFilterParams());
      if (res.data.success) {
        setChats([]);
        setPagination(null);
        if (selectedChat) setSelectedChat(null);
        toast.success("Deleted", `${res.data.deletedCount || count} chat(s) deleted successfully.`);
      }
    } catch {
      toast.error("Error", "Failed to delete chats.");
    } finally {
      setDeletingAll(false);
      fetchChats();
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const res = await AdminAPI.exportChats(buildFilterParams());
      const blob = new Blob([res.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-history-export-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success("Exported", "Chat history exported as CSV.");
    } catch {
      toast.error("Error", "Failed to export chats.");
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (val: string) => {
    setSearch(val);
    setPage(1);
  };

  const toggleFilters = () => setShowFilters(!showFilters);

  const clearFilters = () => {
    setStatusFilter("");
    setUserIdFilter("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const hasActiveFilters = statusFilter || userIdFilter || dateFrom || dateTo;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4 dark:border-white/[0.06]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
            <MessageSquare className="text-primary" size={26} />
            Chat History Management
          </h1>
          <p className="text-muted-foreground text-sm">
            View, search, and manage all chat conversations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || chats.length === 0} className="gap-2">
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export
          </Button>
          {confirmDeleteAll ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Delete all matching chats?</span>
              <button onClick={() => setConfirmDeleteAll(false)} className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
              <button onClick={handleDeleteAll} disabled={deletingAll} className="px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-lg transition-colors">
                {deletingAll ? <Loader2 size={12} className="animate-spin" /> : "Confirm"}
              </button>
            </div>
          ) : (
            <Button variant="destructive" size="sm" onClick={() => setConfirmDeleteAll(true)} disabled={deletingAll || chats.length === 0} className="gap-2">
              <Trash2 size={14} />
              Delete All
            </Button>
          )}
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="w-auto flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by topic or content..."
            className="pl-9"
          />
        </div>
        <Button variant="outline" size="sm" onClick={toggleFilters} className={cn(hasActiveFilters && "border-primary text-primary")}>
          <Filter size={16} className="mr-1" />
          Filters
          {hasActiveFilters && <span className="ml-1 w-2 h-2 rounded-full bg-primary" />}
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        )}
        <div className="flex items-center gap-1 text-sm text-muted-foreground ml-auto">
          <span>{pagination ? `${(pagination.page - 1) * pagination.limit + 1}-${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total}` : ""}</span>
        </div>
      </div>

      {showFilters && (
        <div className="flex w-full flex-wrap items-end gap-3 p-4 rounded-xl border bg-card">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">User</label>
            <select
              value={userIdFilter}
              onChange={(e) => { setUserIdFilter(e.target.value); setPage(1); }}
              className="h-9 rounded-lg border bg-background px-3 text-sm min-w-[160px] focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              <option value="">All Users</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>{u.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">From Date</label>
            <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="h-9 w-[150px]" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">To Date</label>
            <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="h-9 w-[150px]" />
          </div>
        </div>
      )}

      {/* Main Grid: Overall History Table + Detailed Transcript Drawer */}
      <div className="flext gap-12 mt-4 w-full">
        {/* Table Section */}
        <div className={cn("xl:col-span-2", selectedChat && "xl:col-span-1")}>
          <div className="rounded-xl border bg-card">
            {loading ? (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <Loader2 size={20} className="animate-spin mr-2" />
                Loading chat history records...
              </div>
            ) : chats.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
                <p>No chat conversations found.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-white/[0.06] text-xs font-medium text-muted-foreground">
                      <th className="text-left px-4 py-3">Topic / Subject</th>
                      <th className="text-left px-4 py-3">Organization & User</th>
                      <th className="text-left px-4 py-3">Status</th>
                      <th className="text-center px-4 py-3">Msgs</th>
                      <th className="text-left px-4 py-3">Last Activity</th>
                      <th className="text-right px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chats.map((chat) => (
                      <tr key={chat._id}
                        className={cn(
                          "border-b dark:border-white/[0.06] last:border-0 text-sm transition-colors hover:bg-muted/50 dark:hover:bg-white/[0.03]",
                          selectedChat?._id === chat._id && "bg-primary/5 dark:bg-primary/10"
                        )}
                      >
                        <td className="px-4 py-3 max-w-[200px]">
                          <div className="font-semibold text-foreground truncate">{chat.topic || "Untitled Chat"}</div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground flex items-center gap-1">
                              <User size={13} className="text-muted-foreground" />
                              {chat.user_id?.name || "Deleted User"}
                            </span>
                            {chat.organization_id?.name && (
                              <span className="text-xs text-muted-foreground flex items-center gap-1">
                                <Building2 size={11} />
                                {chat.organization_id.name}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold",
                            chat.status === "open"
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "bg-muted text-muted-foreground"
                          )}>
                            {chat.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-medium">{chat.messageCount}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          <div className="flex items-center gap-1 font-mono">
                            <Calendar size={12} />
                            {formatDate(chat.updated_at || chat.created_at)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewChat(chat._id)} title="View Transcript">
                              <Eye size={14} className="text-primary" />
                            </Button>
                            {confirmDeleteId === chat._id ? (
                              <div className="flex items-center gap-1">
                                <button onClick={() => setConfirmDeleteId(null)} className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
                                <button onClick={() => handleDelete(chat)} className="px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded-md font-medium">Delete</button>
                              </div>
                            ) : (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => setConfirmDeleteId(chat._id)} title="Delete Chat">
                                <Trash2 size={14} />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t dark:border-white/[0.06]">
                <span className="text-xs text-muted-foreground">Page {pagination.page} of {pagination.totalPages}</span>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft size={14} className="mr-1" /> Prev
                  </Button>
                  <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>
                    Next <ChevronRight size={14} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Transcript Content Viewer Drawer */}
        {(selectedChat || loadingDetail) && (
          <div className="mt-12 p-12 z-50 fixed top-0 right-0 w-full max-w-2xl h-full overflow-y-auto">
            <div className="rounded-xl border bg-card h-full flex flex-col shadow-lg dark:border-white/[0.06]">
              {loadingDetail ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  Loading conversation transcript...
                </div>
              ) : selectedChat ? (
                <>
                  <div className="flex items-center justify-between px-4 py-3 border-b dark:border-white/[0.06]">
                    <div className="min-w-0">
                      <h3 className="font-bold text-sm truncate flex items-center gap-1.5">
                        <MessageSquare size={16} className="text-primary" />
                        {selectedChat.topic}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        User: <span className="font-medium text-foreground">{selectedChat.user_id?.name}</span> • {selectedChat.messages.length} messages
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {selectedChat.status === "open" && (
                        confirmEndId === selectedChat._id ? (
                          <div className="flex items-center gap-1">
                            <button onClick={() => setConfirmEndId(null)} className="px-2 py-1 text-xs text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
                            <button onClick={() => handleEndChat(selectedChat._id)} className="px-2 py-1 text-xs text-rose-600 hover:bg-rose-500/10 rounded-md font-medium">End</button>
                          </div>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => setConfirmEndId(selectedChat._id)} className="h-7 text-xs px-2 gap-1" title="End Chat">
                            <X size={12} className="text-rose-500" />
                            End Chat
                          </Button>
                        )
                      )}
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelectedChat(null)}>
                        <X size={14} />
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[600px] bg-muted/20">
                    {selectedChat.messages.length === 0 ? (
                      <p className="text-center text-muted-foreground text-xs py-8">No messages in this chat session.</p>
                    ) : (
                      selectedChat.messages.map((msg) => (
                        <div key={msg._id} className={cn(
                          "flex flex-col max-w-[85%]",
                          msg.is_ai ? "items-start" : "items-end ml-auto"
                        )}>
                          <div className={cn(
                            "rounded-2xl px-4 py-2.5 text-sm shadow-xs",
                            msg.is_ai
                              ? "bg-card border text-card-foreground dark:border-white/[0.06]"
                              : "bg-primary text-primary-foreground"
                          )}>
                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                          <div className="flex items-center gap-1 mt-1 px-1">
                            <span className="text-[10px] text-muted-foreground/70 font-semibold">
                              {msg.is_ai ? "AI Support Bot" : msg.sender_id?.name || "User"}
                            </span>
                            <span className="text-[10px] text-muted-foreground/50 font-mono">
                              • {new Date(msg.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
