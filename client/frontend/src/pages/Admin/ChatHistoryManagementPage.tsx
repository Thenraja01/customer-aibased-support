import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Trash2, MessageSquare, ChevronLeft,
  ChevronRight, Eye, Filter, Loader2, User,
  Calendar, Building2, Download, XCircle
} from "lucide-react";
import { AdminAPI } from "@/api/admin.api";
import { ChatAPI } from "@/api/chat.api";
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

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function ChatHistoryManagementPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const [chats, setChats] = useState<ChatRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [users, setUsers] = useState<{ _id: string; name: string; email: string }[]>([]);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [confirmCloseAll, setConfirmCloseAll] = useState(false);
  const [closingAll, setClosingAll] = useState(false);
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

  const handleViewChat = (chatId: string) => {
    const isSuperAdmin = window.location.pathname.startsWith("/superadmin");
    const basePath = isSuperAdmin ? "/superadmin/chat-history" : "/admin/chat-history";
    navigate(`${basePath}/${chatId}`);
  };

  const handleDelete = async (chat: ChatRecord) => {
    setConfirmDeleteId(null);
    try {
      await AdminAPI.deleteChat(chat._id);
      toast.success("Chat Deleted", `"${chat.topic}" and all messages removed.`);
      fetchChats();
    } catch {
      toast.error("Error", "Failed to delete chat.");
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
        toast.success("Deleted", `${res.data.deletedCount || count} chat(s) deleted successfully.`);
      }
    } catch {
      toast.error("Error", "Failed to delete chats.");
    } finally {
      setDeletingAll(false);
      fetchChats();
    }
  };

  const handleCloseAll = async () => {
    setConfirmCloseAll(false);
    setClosingAll(true);
    try {
      await ChatAPI.closeAll();
      toast.success("Closed All", "All active chat sessions have been closed.");
      fetchChats();
    } catch {
      toast.error("Error", "Failed to close chat sessions.");
    } finally {
      setClosingAll(false);
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
          <h1 className="text-2xl sm:text-3xl font-bold  flex items-center gap-2">
            <MessageSquare className="text-primary" size={26} />
            Chat History Management
          </h1>
          <p className="text-muted-foreground text-sm">
            View, search, and manage all chat conversations.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleExport} disabled={exporting || chats.length === 0} className="gap-2">
            {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
            Export
          </Button>

          {confirmCloseAll ? (
            <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
              <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Close all active chats?</span>
              <button onClick={() => setConfirmCloseAll(false)} className="px-2 py-0.5 text-xs text-muted-foreground hover:bg-muted rounded-md">Cancel</button>
              <button onClick={handleCloseAll} disabled={closingAll} className="px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/20 hover:bg-amber-500/30 rounded-md transition-colors">
                {closingAll ? <Loader2 size={12} className="animate-spin" /> : "Confirm"}
              </button>
            </div>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setConfirmCloseAll(true)} disabled={closingAll || chats.length === 0} className="gap-2 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10">
              <XCircle size={14} />
              Close All
            </Button>
          )}

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
                      "border-b dark:border-white/[0.06] last:border-0 text-sm transition-colors hover:bg-muted/50 dark:hover:bg-white/[0.03]"
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
  );
}
