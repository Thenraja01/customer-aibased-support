import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Download, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import AuditLogTable from "@/components/admin/AuditLogTable";
import { useAdminAuditLogs } from "@/hooks/useAdminAuditLogs";
import { AuditLogEntry } from "@/api/admin.api";
import { useAuthContext } from "@/context/AuthContext";

const ACTION_OPTIONS = [
  "CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT",
  "EXPORT", "IMPORT", "APPROVE", "REJECT", "VIEW",
  "SEND", "RECEIVE", "ASSIGN", "UNASSIGN", "ESCALATE",
  "RESOLVE", "CLOSE", "REOPEN", "ARCHIVE", "RESTORE"
];

const TABLE_OPTIONS = [
  "User", "Organization", "Branch", "Document", "DocumentChunk",
  "DocumentVerification", "Chat", "Message", "Ticket",
  "Notification", "AuditLog", "Role", "DocumentType",
  "GlobalSetting", "AISession", "ChatMemory", "TicketTemplate",
  "FAQ", "KnowledgeGap", "PromptVersion", "AIConfig"
];

export default function AuditLogsPage() {
  const { user } = useAuthContext();
  const isSuperAdmin = user?.roleName?.toLowerCase() === "super_admin";

  const {
    auditLogs,
    logPagination,
    loading,
    error,
    fetchAuditLogs,
    setPage,
    params,
  } = useAdminAuditLogs();

  const [actionFilter, setActionFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [userFilter, setUserFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handleFetch = useCallback((newParams?: Record<string, unknown>) => {
    const mergedParams = {
      page: params.page,
      limit: params.limit,
      action: actionFilter || undefined,
      tableName: tableFilter || undefined,
      userId: userFilter || undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      search: searchQuery || undefined,
      ...newParams,
    };
    fetchAuditLogs(mergedParams);
  }, [params.page, params.limit, actionFilter, tableFilter, userFilter, fromDate, toDate, searchQuery, fetchAuditLogs]);

  useEffect(() => {
    handleFetch();
  }, [handleFetch]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    handleFetch({ page: 1 });
  };

  const handleClearFilters = () => {
    setActionFilter("");
    setTableFilter("");
    setUserFilter("");
    setFromDate("");
    setToDate("");
    setSearchQuery("");
    setPage(1);
    handleFetch({ page: 1 });
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/admin/v1/audit-logs/export?${new URLSearchParams({
        action: actionFilter || "",
        tableName: tableFilter || "",
        userId: userFilter || "",
        from: fromDate || "",
        to: toDate || "",
        search: searchQuery || "",
      }).toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token") ?? ""}`,
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleViewDetail = (log: AuditLogEntry) => {
    setSelectedLog(log);
  };

  const hasActiveFilters = actionFilter || tableFilter || userFilter || fromDate || toDate || searchQuery;

  return (
    <div className="space-y-4">
      {/* Page Top Section: Title & Description with reserved right space */}
      <div className="page-top relative pt-4 pr-[320px]">
        <h1 className="text-3xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground mt-1">
          {isSuperAdmin
            ? "Track all system activity and changes across all organizations."
            : "Track all system activity and changes within your organization."}
        </p>
      </div>

      {/* Page Actions Section: Export CSV & Refresh */}
      <div className="page-actions flex justify-end items-center gap-2 mt-2 mb-4">
        <Button variant="outline" onClick={handleExport} disabled={isExporting || loading}>
          <Download className="mr-2 h-4 w-4" />
          {isExporting ? "Exporting..." : "Export CSV"}
        </Button>
        <Button variant="outline" onClick={() => handleFetch()} disabled={loading}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search logs..."
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={(val) => setActionFilter(val || "")}>
            <SelectTrigger className="max-w-[180px]">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actions</SelectItem>
              {ACTION_OPTIONS.map((action) => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={tableFilter} onValueChange={(val) => setTableFilter(val || "")}>
            <SelectTrigger className="max-w-[180px]">
              <SelectValue placeholder="Table" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tables</SelectItem>
              {TABLE_OPTIONS.map((table) => (
                <SelectItem key={table} value={table}>{table}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
            placeholder="User ID"
            className="max-w-[150px]"
          />
          <Input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="max-w-[170px]"
            placeholder="From"
          />
          <Input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="max-w-[170px]"
            placeholder="To"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Label htmlFor="pageSize">Rows per page:</Label>
            <Select value={String(params.limit || 20)} onValueChange={(v) => handleFetch({ limit: Number(v), page: 1 })}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasActiveFilters && (
            <Button type="button" variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="mr-1 h-3 w-3" />
              Clear Filters
            </Button>
          )}
        </div>
      </form>

      {error && (
        <div className="rounded-lg border bg-destructive/10 p-4 text-destructive">
          <p className="font-medium">Error loading audit logs</p>
          <p className="text-sm">{error.message}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => handleFetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
      )}

      <div className="rounded-lg border bg-card">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            <span className="ml-3 text-muted-foreground">Loading audit logs...</span>
          </div>
        ) : (
          <AuditLogTable logs={auditLogs} onViewDetail={handleViewDetail} />
        )}
      </div>

      {logPagination && logPagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Showing {((logPagination.page - 1) * logPagination.limit) + 1}-
            {Math.min(logPagination.page * logPagination.limit, logPagination.total)} of {logPagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={logPagination.page === 1 || loading}
              onClick={() => setPage(logPagination.page - 1)}
            >
              Previous
            </Button>
            <span className="flex items-center px-3 text-sm text-muted-foreground">
              Page {logPagination.page} of {logPagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={logPagination.page >= logPagination.totalPages || loading}
              onClick={() => setPage(logPagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {logPagination && logPagination.total === 0 && !loading && !error && (
        <div className="text-center py-12 text-muted-foreground">
          <Filter className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-lg">No audit logs found</p>
          <p className="text-sm">Try adjusting your filters or search query</p>
        </div>
      )}

      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
            <DialogDescription>
              Detailed view of the selected audit log entry
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <ScrollArea className="h-[60vh] p-4">
              <div className="space-y-4 text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-muted-foreground">ID</label>
                    <p className="font-mono break-all">{selectedLog._id}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Timestamp</label>
                    <p>{new Date(selectedLog.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Action</label>
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${actionColors[selectedLog.action] || "bg-muted text-muted-foreground"}`}
                    >
                      {selectedLog.action}
                    </span>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Table</label>
                    <Badge variant="outline">{selectedLog.table_name}</Badge>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Record ID</label>
                    <p className="font-mono text-xs">{selectedLog.record_id}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">User</label>
                    <p>
                      {typeof selectedLog.user_id === "object"
                        ? selectedLog.user_id?.name || selectedLog.user_id?.email
                        : selectedLog.user_id || "-"}
                    </p>
                  </div>
                  {selectedLog.organization_id && (
                    <div>
                      <label className="text-muted-foreground">Organization ID</label>
                      <p className="font-mono text-xs">{selectedLog.organization_id}</p>
                    </div>
                  )}
                  {selectedLog.branch_id && (
                    <div>
                      <label className="text-muted-foreground">Branch ID</label>
                      <p className="font-mono text-xs">{selectedLog.branch_id}</p>
                    </div>
                  )}
                  {selectedLog.ip_address && (
                    <div className="col-span-2">
                      <label className="text-muted-foreground">IP Address</label>
                      <p className="font-mono text-xs">{selectedLog.ip_address}</p>
                    </div>
                  )}
                  {selectedLog.user_agent && (
                    <div className="col-span-2">
                      <label className="text-muted-foreground">User Agent</label>
                      <p className="font-mono text-xs max-h-24 overflow-auto">{selectedLog.user_agent}</p>
                    </div>
                  )}
                </div>

                {(selectedLog.old_value || selectedLog.new_value) && (
                  <div className="border-t pt-4">
                    <h4 className="font-medium mb-3">Value Changes</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-muted-foreground">Old Value</label>
                        <pre className="whitespace-pre-wrap text-muted-foreground bg-muted p-3 rounded text-xs max-h-64 overflow-auto font-mono">
                          {JSON.stringify(selectedLog.old_value, null, 2) || "-"}
                        </pre>
                      </div>
                      <div>
                        <label className="text-muted-foreground">New Value</label>
                        <pre className="whitespace-pre-wrap text-muted-foreground bg-muted p-3 rounded text-xs max-h-64 overflow-auto font-mono">
                          {JSON.stringify(selectedLog.new_value, null, 2) || "-"}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

const actionColors: Record<string, string> = {
  CREATE: "bg-primary/10 text-primary",
  UPDATE: "bg-secondary/10 text-secondary",
  DELETE: "bg-destructive/10 text-destructive",
  LOGIN: "bg-green/10 text-green",
  LOGOUT: "bg-orange/10 text-orange",
  EXPORT: "bg-blue/10 text-blue",
  IMPORT: "bg-purple/10 text-purple",
  APPROVE: "bg-emerald/10 text-emerald",
  REJECT: "bg-red/10 text-red",
};

function Label({ htmlFor, children }: { htmlFor: string; children: React.ReactNode }) {
  return <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">{children}</label>;
}