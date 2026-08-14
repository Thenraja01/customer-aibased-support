import { useState, useEffect, useCallback } from "react";
import { CreditCard, Download, HardDrive, Zap, Loader2, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

const PLANS: { value: string; label: string; price: number; blurb: string }[] = [
  { value: "free", label: "Free", price: 0, blurb: "1k AI requests / mo" },
  { value: "starter", label: "Starter", price: 49, blurb: "10k AI requests / mo" },
  { value: "business", label: "Business", price: 149, blurb: "100k AI requests / mo" },
  { value: "enterprise", label: "Enterprise", price: 499, blurb: "1M AI requests / mo" },
];

const fmtBytes = (b: number) => {
  if (!b) return "0 B";
  const gb = b / 1024 ** 3;
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = b / 1024 ** 2;
  if (mb >= 1) return `${mb.toFixed(0)} MB`;
  return `${Math.round(b / 1024)} KB`;
};

const fmtMoney = (n: number) => `$${Number(n || 0).toFixed(2)}`;

export default function BillingPanel() {
  const toast = useToast();
  const [billing, setBilling] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [changing, setChanging] = useState(false);
  const [confirmPlan, setConfirmPlan] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [bRes, iRes] = await Promise.all([AdminAPI.getBilling(), AdminAPI.getInvoices({ limit: 25 })]);
      setBilling(bRes.data.data);
      setInvoices(iRes.data.data || []);
    } catch {
      toast.error("Error", "Failed to load billing information");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleChangePlan = async () => {
    if (!confirmPlan) return;
    setChanging(true);
    try {
      const res = await AdminAPI.changePlan(confirmPlan);
      toast.success("Success", `Plan changed to ${confirmPlan}`);
      setConfirmPlan(null);
      setBilling((prev: any) => ({ ...prev, plan: confirmPlan, ...res.data.data }));
      load();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to change plan");
    } finally {
      setChanging(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading billing...</div>;
  }

  const currentPlan = PLANS.find((p) => p.value === billing?.plan) || PLANS[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <CreditCard size={18} className="text-primary" />
          Billing & Usage
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Plan entitlements, current usage, and invoice history. Limits are enforced server-side.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border dark:border-white/[0.06] p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium flex items-center gap-2">
              <Zap size={15} className="text-primary" />
              AI Requests
            </p>
            <Badge>{billing?.plan}</Badge>
          </div>
          <p className="text-2xl font-bold mt-2">
            {billing?.ai_requests_month ?? 0}
            <span className="text-sm font-normal text-muted-foreground"> / {billing?.ai_requests_limit ?? 0}</span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, billing?.ai_usage_percent ?? 0)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{billing?.ai_usage_percent ?? 0}% used this period</p>
        </div>

        <div className="rounded-xl border dark:border-white/[0.06] p-4">
          <p className="text-sm font-medium flex items-center gap-2">
            <HardDrive size={15} className="text-primary" />
            Storage
          </p>
          <p className="text-2xl font-bold mt-2">
            {fmtBytes(billing?.storage_used ?? 0)}
            <span className="text-sm font-normal text-muted-foreground"> / {fmtBytes(billing?.storage_limit ?? 0)}</span>
          </p>
          <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, billing?.storage_percent ?? 0)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">{billing?.storage_percent ?? 0}% used</p>
        </div>

        <div className="rounded-xl border dark:border-white/[0.06] p-4">
          <p className="text-sm font-medium flex items-center gap-2">
            <ReceiptText size={15} className="text-primary" />
            Subscription
          </p>
          <p className="text-2xl font-bold mt-2">{currentPlan.price === 0 ? "Free" : `$${currentPlan.price}`}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
          {billing?.subscription_end ? (
            <p className="text-xs text-muted-foreground mt-1.5">Renews {new Date(billing.subscription_end).toLocaleDateString()}</p>
          ) : (
            <p className="text-xs text-muted-foreground mt-1.5">{billing?.invoice_count || 0} invoice(s) on file</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border dark:border-white/[0.06]">
        <div className="px-4 py-3 border-b dark:border-white/[0.06]">
          <p className="text-sm font-semibold">Change Plan</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4">
          {PLANS.filter((p) => p.value !== "free").map((p) => {
            const isCurrent = billing?.plan === p.value;
            return (
              <div key={p.value} className="rounded-lg border dark:border-white/[0.06] p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{p.label}</p>
                  {isCurrent && <Badge>Current</Badge>}
                </div>
                <p className="text-lg font-bold">${p.price}<span className="text-xs font-normal text-muted-foreground">/mo</span></p>
                <p className="text-xs text-muted-foreground">{p.blurb}</p>
                <Button size="sm" variant={isCurrent ? "outline" : "default"} disabled={isCurrent} className="mt-2" onClick={() => setConfirmPlan(p.value)}>
                  {isCurrent ? "Active" : "Switch"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border dark:border-white/[0.06] overflow-hidden">
        <div className="px-4 py-3 border-b dark:border-white/[0.06] flex items-center justify-between">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Download size={15} className="text-primary" />
            Invoice History
          </p>
          <span className="text-xs text-muted-foreground">{billing?.invoice_count || 0} total</span>
        </div>
        {invoices.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">No invoices yet.</div>
        ) : (
          <div className="divide-y dark:divide-white/[0.06]">
            {invoices.map((inv: any) => (
              <div key={inv._id} className="px-4 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{inv.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(inv.created_at).toLocaleDateString()} · {inv.plan} plan{inv.notes ? ` · ${inv.notes}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{fmtMoney(inv.amount_usd)}</p>
                  <Badge variant={inv.status === "paid" ? "default" : inv.status === "failed" ? "destructive" : "secondary"}>
                    {inv.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmPlan}
        variant="default"
        title={`Switch to ${confirmPlan || ""} plan?`}
        message={`This immediately applies new limits (${PLANS.find((p) => p.value === confirmPlan)?.blurb}) and records an invoice. Downgrades to Free are not supported.`}
        confirmLabel="Confirm"
        onConfirm={handleChangePlan}
        onCancel={() => setConfirmPlan(null)}
      />
      {changing && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      )}
    </div>
  );
}