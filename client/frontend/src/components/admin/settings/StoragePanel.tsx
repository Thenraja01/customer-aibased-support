import { useState, useEffect, useCallback } from "react";
import { Database, Zap } from "lucide-react";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";

const fmtBytes = (b: number) => {
  if (!b) return "0 B";
  const gb = b / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = b / 1024 ** 2;
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  return `${Math.round(b / 1024)} KB`;
};

export default function StoragePanel() {
  const toast = useToast();
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await AdminAPI.getBilling();
      setBilling(res.data.data);
    } catch {
      toast.error("Error", "Failed to load storage usage");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading storage...</div>;
  }

  const storagePercent = Math.min(100, billing?.storage_percent ?? 0);
  const aiPercent = Math.min(100, billing?.ai_usage_percent ?? 0);

  return (
    <div className="space-y-6 max-w-xl">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Database size={18} className="text-primary" />
          Storage & Quota
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Document storage and AI request allowance for your current plan.
        </p>
      </div>

      <div className="rounded-xl border dark:border-white/[0.06] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Database size={15} className="text-primary" />
            Storage
          </p>
          <p className="text-sm text-muted-foreground">
            {fmtBytes(billing?.storage_used ?? 0)} / {fmtBytes(billing?.storage_limit ?? 0)}
          </p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${storagePercent >= 90 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${storagePercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">{storagePercent}% used · documents, chunks, and embeddings</p>
      </div>

      <div className="rounded-xl border dark:border-white/[0.06] p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium flex items-center gap-2">
            <Zap size={15} className="text-primary" />
            AI Requests
          </p>
          <p className="text-sm text-muted-foreground">
            {billing?.ai_requests_month ?? 0} / {billing?.ai_requests_limit ?? 0}
          </p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${aiPercent >= 90 ? "bg-destructive" : "bg-primary"}`}
            style={{ width: `${aiPercent}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1.5">
          {aiPercent}% used · when this reaches 100%, the assistant responds with an upgrade notice
          {billing?.ai_requests_reset_at ? ` · resets ${new Date(billing.ai_requests_reset_at).toLocaleDateString()}` : ""}
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Limits are enforced server-side. Upgrade your plan under the <span className="font-medium">Billing</span> tab to raise them.
      </p>
    </div>
  );
}