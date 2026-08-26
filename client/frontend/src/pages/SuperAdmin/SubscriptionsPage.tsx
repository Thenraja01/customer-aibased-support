import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Plus,
  Edit2,
  Trash2,
  Download,
  TrendingUp,
  DollarSign,
  Building2,
  FileText,
  CheckCircle2,
  Zap,
  HardDrive,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AdminAPI } from "@/api/admin.api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

export default function SubscriptionsPage() {
  const toast = useToast();
  const [overview, setOverview] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPlan, setSavingPlan] = useState(false);

  // Edit / Create Plan Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);

  // Form Fields
  const [planKey, setPlanKey] = useState("");
  const [planName, setPlanName] = useState("");
  const [planPrice, setPlanPrice] = useState(0);
  const [planStorageMb, setPlanStorageMb] = useState(500);
  const [planAiRequests, setPlanAiRequests] = useState(1000);
  const [planBlurb, setPlanBlurb] = useState("");
  const [planFeatures, setPlanFeatures] = useState("");
  const [planBadge, setPlanBadge] = useState("");

  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [ovRes, invRes, plRes] = await Promise.all([
        AdminAPI.getSuperAdminBillingOverview().catch(() => ({ data: { success: false, data: null } })),
        AdminAPI.getSuperAdminInvoices({ limit: 25 }).catch(() => ({ data: { success: false, data: [] } })),
        AdminAPI.getPlatformPlans().catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (ovRes.data?.success) setOverview(ovRes.data.data);
      if (invRes.data?.success) setInvoices(invRes.data.data || []);
      if (plRes.data?.success) setPlans(plRes.data.data || []);
    } catch {
      toast.error("Error", "Failed to load subscriptions & billing telemetry");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanKey("");
    setPlanName("");
    setPlanPrice(99);
    setPlanStorageMb(10240);
    setPlanAiRequests(25000);
    setPlanBlurb("Custom Tier Plan");
    setPlanFeatures("Custom Requests\nDedicated SLA\nPriority Ingestion");
    setPlanBadge("Custom");
    setEditModalOpen(true);
  };

  const openEditModal = (p: any) => {
    setEditingPlan(p);
    setPlanKey(p.plan_key);
    setPlanName(p.name);
    setPlanPrice(p.price_usd || 0);
    setPlanStorageMb(Math.round((p.storage_limit_bytes || 524288000) / (1024 * 1024)));
    setPlanAiRequests(p.ai_requests_limit || 1000);
    setPlanBlurb(p.blurb || "");
    setPlanFeatures(Array.isArray(p.features) ? p.features.join("\n") : "");
    setPlanBadge(p.badge || "");
    setEditModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planKey.trim() || !planName.trim()) {
      toast.error("Validation Error", "Plan key and name are required");
      return;
    }

    try {
      setSavingPlan(true);
      const payload = {
        plan_key: planKey.trim().toLowerCase(),
        name: planName.trim(),
        price_usd: Number(planPrice),
        storage_limit_bytes: Number(planStorageMb) * 1024 * 1024,
        ai_requests_limit: Number(planAiRequests),
        blurb: planBlurb.trim(),
        features: planFeatures
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean),
        badge: planBadge.trim(),
      };

      await AdminAPI.savePlatformPlan(payload);
      toast.success("Success", `Plan "${planName}" configuration saved`);
      setEditModalOpen(false);
      loadData();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to save plan limits");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!confirmDeleteKey) return;
    try {
      await AdminAPI.deletePlatformPlan(confirmDeleteKey);
      toast.success("Success", `Plan deleted`);
      setConfirmDeleteKey(null);
      loadData();
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to delete plan");
    }
  };

  const handleDownloadInvoice = (invoiceId: string) => {
    const url = AdminAPI.downloadInvoiceUrl(invoiceId);
    window.open(url, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
        <RefreshCw className="animate-spin mr-2 h-4 w-4" />
        Loading billing & plan configurations...
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <CreditCard className="text-primary h-6 w-6" />
            Platform Subscriptions & Billing
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure live SaaS pricing tiers, customize tenant quota allocations, and monitor global invoice revenue.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </Button>
          <Button size="sm" onClick={openCreateModal} className="gap-2">
            <Plus className="h-4 w-4" /> Create Custom Plan
          </Button>
        </div>
      </div>

      {/* Revenue & Telemetry KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium uppercase tracking-wider">
            <span>Monthly Run Rate (MRR)</span>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            ${Number(overview?.mrr || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
            ARR: ${(Number(overview?.arr || 0)).toLocaleString()}/yr
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium uppercase tracking-wider">
            <span>Paying Subscribers</span>
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {overview?.activeSubscribers || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Across {overview?.totalOrganizations || 0} total active organizations
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium uppercase tracking-wider">
            <span>Invoices Processed</span>
            <FileText className="h-4 w-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {overview?.totalInvoices || invoices.length || 0}
          </div>
          <p className="text-xs text-muted-foreground">All time tenant billing records</p>
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-medium uppercase tracking-wider">
            <span>Active SaaS Plans</span>
            <Building2 className="h-4 w-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-extrabold text-foreground">
            {plans.length}
          </div>
          <p className="text-xs text-muted-foreground">Customizable in real-time below</p>
        </div>
      </div>

      {/* Plan Entitlement Customizer Matrix */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              SaaS Plan Limits & Entitlements
            </h2>
            <p className="text-xs text-muted-foreground">
              Changes made here instantly update server-side quota limits and pricing tables for all tenants.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {plans.map((p) => {
            const isCore = ["free", "starter", "business", "enterprise"].includes(p.plan_key);
            const storageGb = ((p.storage_limit_bytes || 524288000) / (1024 ** 3)).toFixed(1);
            return (
              <div
                key={p.plan_key}
                className="rounded-xl border bg-card/60 hover:bg-card transition-all p-5 flex flex-col justify-between shadow-sm relative overflow-hidden group"
              >
                {p.badge && (
                  <div className="absolute top-3 right-3">
                    <Badge variant="outline" className="text-[10px] font-bold border-primary/40 text-primary">
                      {p.badge}
                    </Badge>
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-lg text-foreground capitalize">{p.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{p.blurb || "Plan tier"}</p>
                  </div>

                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black">${p.price_usd}</span>
                    <span className="text-xs text-muted-foreground">/ month</span>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-primary" /> AI Requests:
                      </span>
                      <span className="font-semibold text-foreground">
                        {Number(p.ai_requests_limit).toLocaleString()} / mo
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <HardDrive className="h-3.5 w-3.5 text-primary" /> Storage:
                      </span>
                      <span className="font-semibold text-foreground">
                        {Number(storageGb) >= 1 ? `${storageGb} GB` : `${Math.round((p.storage_limit_bytes || 524288000) / (1024 * 1024))} MB`}
                      </span>
                    </div>
                  </div>

                  {Array.isArray(p.features) && p.features.length > 0 && (
                    <div className="pt-2 space-y-1">
                      {p.features.slice(0, 3).map((f: string, i: number) => (
                        <div key={i} className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{f}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-4 mt-3 border-t border-border/40">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs gap-1.5"
                    onClick={() => openEditModal(p)}
                  >
                    <Edit2 className="h-3.5 w-3.5" /> Edit Limits
                  </Button>
                  {!isCore && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10 px-2"
                      onClick={() => setConfirmDeleteKey(p.plan_key)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Invoices Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Global Tenant Invoices
            </h2>
            <p className="text-xs text-muted-foreground">
              Audit and download generated invoice receipts across all platform organizations.
            </p>
          </div>
        </div>

        <div className="rounded-xl border bg-card overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/40 border-b border-border text-xs uppercase text-muted-foreground font-semibold">
              <tr>
                <th className="py-3 px-4">Organization</th>
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Plan Tier</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Date Paid</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground text-xs">
                    No billing invoices generated yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv._id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {inv.organization_id?.name || "SupportAI Tenant"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                      {inv.invoice_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <Badge variant="outline" className="capitalize text-xs font-semibold">
                        {inv.plan}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-foreground">
                      ${Number(inv.amount_usd || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 capitalize">
                        {inv.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-muted-foreground">
                      {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : "N/A"}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-xs text-primary hover:text-primary/80"
                        onClick={() => handleDownloadInvoice(inv._id)}
                      >
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit / Create Plan Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div>
              <h3 className="text-lg font-bold text-foreground">
                {editingPlan ? `Edit Plan: ${editingPlan.name}` : "Create Custom SaaS Plan"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set prices and hardware quota allocations for this plan tier.
              </p>
            </div>

            <form onSubmit={handleSavePlan} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Plan Key (Identifier)</label>
                  <Input
                    value={planKey}
                    onChange={(e) => setPlanKey(e.target.value)}
                    disabled={!!editingPlan}
                    placeholder="e.g. enterprise_plus"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Display Name</label>
                  <Input
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                    placeholder="e.g. Enterprise Plus"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Price ($/mo)</label>
                  <Input
                    type="number"
                    min={0}
                    value={planPrice}
                    onChange={(e) => setPlanPrice(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">AI Quota / Mo</label>
                  <Input
                    type="number"
                    min={100}
                    value={planAiRequests}
                    onChange={(e) => setPlanAiRequests(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Storage (MB)</label>
                  <Input
                    type="number"
                    min={50}
                    value={planStorageMb}
                    onChange={(e) => setPlanStorageMb(Number(e.target.value))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Summary Blurb</label>
                  <Input
                    value={planBlurb}
                    onChange={(e) => setPlanBlurb(e.target.value)}
                    placeholder="e.g. 100k requests • 50GB storage"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-muted-foreground">Badge (Optional)</label>
                  <Input
                    value={planBadge}
                    onChange={(e) => setPlanBadge(e.target.value)}
                    placeholder="e.g. Popular, Scale, Pro"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Features (One per line)</label>
                <Textarea
                  rows={3}
                  value={planFeatures}
                  onChange={(e) => setPlanFeatures(e.target.value)}
                  placeholder="50,000 AI Chat Requests&#10;Multi-Branch Isolation&#10;Priority 24/7 SLA"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={savingPlan}>
                  {savingPlan ? "Saving..." : "Save Plan Limits"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={!!confirmDeleteKey}
        title="Delete Custom Plan"
        description={`Are you sure you want to delete the plan "${confirmDeleteKey}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDeletePlan}
        onCancel={() => setConfirmDeleteKey(null)}
      />
    </div>
  );
}
