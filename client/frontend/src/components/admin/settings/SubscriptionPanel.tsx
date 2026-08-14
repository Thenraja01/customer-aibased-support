import { useState, useEffect, useCallback } from "react";
import { Crown, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";

const PLAN_FEATURES: Record<string, { label: string; features: string[] }> = {
  free: { label: "Free", features: ["1,000 AI requests / month", "512 MB storage", "Community support"] },
  starter: { label: "Starter", features: ["10,000 AI requests / month", "5 GB storage", "Email support", "3 AI provider slots"] },
  business: { label: "Business", features: ["100,000 AI requests / month", "50 GB storage", "Priority support", "Full analytics suite", "5 AI provider slots"] },
  enterprise: { label: "Enterprise", features: ["1,000,000 AI requests / month", "500 GB storage", "Dedicated support", "Custom SLAs", "Unlimited providers"] },
};

export default function SubscriptionPanel() {
  const toast = useToast();
  const [billing, setBilling] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await AdminAPI.getBilling();
      setBilling(res.data.data);
    } catch {
      toast.error("Error", "Failed to load subscription");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return <div className="text-sm text-muted-foreground py-8 text-center">Loading subscription...</div>;
  }

  const current = billing?.plan || "free";
  const ordered = ["free", "starter", "business", "enterprise"];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Crown size={18} className="text-primary" />
          Subscription
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your current plan and what it includes. Upgrade anytime — limits apply immediately.
        </p>
      </div>

      <div className="rounded-xl border dark:border-white/[0.06] p-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Crown size={18} className="text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold capitalize">{current} plan</p>
            <p className="text-xs text-muted-foreground">
              {billing?.subscription_end
                ? `Renews ${new Date(billing.subscription_end).toLocaleDateString()}`
                : "Free plan — no billing cycle"}
            </p>
          </div>
        </div>
        <Badge>{current}</Badge>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {ordered.map((p) => {
          const info = PLAN_FEATURES[p];
          const isCurrent = current === p;
          return (
            <div key={p} className={`rounded-xl border p-4 flex flex-col gap-2 ${isCurrent ? "border-primary/40 bg-primary/5" : "dark:border-white/[0.06]"}`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">{info.label}</p>
                {isCurrent && <Badge>Current</Badge>}
              </div>
              <ul className="space-y-1.5 text-xs text-muted-foreground">
                {info.features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5">
                    {isCurrent ? <Check size={13} className="text-primary shrink-0 mt-0.5" /> : <X size={13} className="text-muted-foreground/40 shrink-0 mt-0.5" />}
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}