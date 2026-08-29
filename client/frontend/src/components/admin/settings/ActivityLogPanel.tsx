import { useState, useEffect, useCallback } from "react";
import { ScrollText, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";

const ACTION_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  BILLING_PLAN_CHANGED: "default",
  AI_PROVIDER_CREATED: "default",
  AI_PROVIDER_UPDATED: "default",
  AI_PROVIDER_DELETED: "destructive",
  AI_PROVIDER_TESTED: "outline",
  ORG_API_KEY_CREATED: "default",
  ORG_API_KEY_REVOKED: "destructive",
};

export default function ActivityLogPanel() {
  const toast = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState<any>(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const params: any = { page: p, limit: 25 };
      if (search) params.search = search;
      const res = await AdminAPI.getAuditLogs(params);
      const data = res.data.data || [];
      const pag = res.data.pagination;
      setLogs(data);
      setPagination(pag);
    } catch {
      toast.error("Error", "Failed to load activity log");
    } finally {
      setLoading(false);
    }
  }, [toast, search]);

  useEffect(() => {
    const t = setTimeout(() => load(page), 300);
    return () => clearTimeout(t);
  }, [load, page]);

  const fmtTime = (iso: string) =>
    new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ScrollText size={18} className="text-primary" />
          Activity Log
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Audit trail of security, AI configuration, billing, and key-management events.
        </p>
      </div>

      <div className="flex items-center gap-2">
        <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Search by action, table, or value..." className="max-w-sm" />
        <Button variant="outline" size="sm" onClick={() => load(page)}>
          <RefreshCw size={14} className="mr-1" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={20} className="animate-spin text-primary" />
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-xl border border-dashed dark:border-white/[0.1] p-8 text-center text-sm text-muted-foreground">
          No activity recorded yet.
        </div>
      ) : (
        <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden">
          <div className="divide-y dark:divide-white/[0.06]">
            {logs.map((log: any) => {
              const userName = log.user_id?.name || log.user_id?.email || "System";
              const action = log.action || "";
              const variant = ACTION_VARIANTS[action] || "outline";
              return (
                <div key={log._id} className="px-4 py-3 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={variant}>{action}</Badge>
                      <span className="text-sm font-medium">{userName}</span>
                      {log.table_name && <span className="text-xs text-muted-foreground">· {log.table_name}</span>}
                    </div>
                    {log.new_value && (
                      <pre className="mt-1.5 text-[11px] font-mono text-muted-foreground truncate max-w-xl">
                        {JSON.stringify(log.new_value)}
                      </pre>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{fmtTime(log.created_at)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Page {pagination.page} of {pagination.totalPages} · {pagination.total} events</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</Button>
            <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}