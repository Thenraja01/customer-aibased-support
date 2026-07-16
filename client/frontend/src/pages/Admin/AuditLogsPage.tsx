import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import AuditLogTable from "@/components/admin/AuditLogTable";
import { useAdminAuditLogs } from "@/hooks/useAdminAuditLogs";

export default function AuditLogsPage() {
  const { auditLogs, logPagination, fetchAuditLogs } =
    useAdminAuditLogs();

  const [actionFilter, setActionFilter] = useState("");
  const [tableFilter, setTableFilter] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const params: any = { page, limit: 20 };
    if (actionFilter) params.action = actionFilter;
    if (tableFilter) params.tableName = tableFilter;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    fetchAuditLogs(params);
  }, [page, actionFilter, tableFilter, fromDate, toDate, fetchAuditLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Logs</h1>
        <p className="text-muted-foreground">
          Track all system activity and changes.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
            placeholder="Filter by action..."
            className="pl-9"
          />
        </div>
        <Input
          value={tableFilter}
          onChange={(e) => { setTableFilter(e.target.value); setPage(1); }}
          placeholder="Table name"
          className="max-w-[150px]"
        />
        <Input
          type="date"
          value={fromDate}
          onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
          className="max-w-[170px]"
        />
        <Input
          type="date"
          value={toDate}
          onChange={(e) => { setToDate(e.target.value); setPage(1); }}
          className="max-w-[170px]"
        />
      </div>

      <div className="rounded-xl border bg-card">
        <AuditLogTable logs={auditLogs} />
      </div>

      {logPagination && logPagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * 20 + 1}-
            {Math.min(page * 20, logPagination.total)} of {logPagination.total}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= logPagination.totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
