import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, X, Shield, Users, CreditCard, Sparkles, Database, Bot } from "lucide-react";
import type { IOrganization } from "@/types";

interface Props {
  organization?: IOrganization | null;
  onSubmit: (data: any) => Promise<void>;
  onClose: () => void;
}

interface FormErrors {
  organization_id?: string;
  name?: string;
  email?: string;
  phone?: string;
  submit?: string;
}

const AVAILABLE_ROLES = [
  { id: "admin", label: "Admin", desc: "Organization Administrator", badge: "Org Level" },
  { id: "branch_admin", label: "Branch Admin", desc: "Branch Manager", badge: "Branch Level" },
  { id: "support", label: "Support", desc: "Support Agent / Operator", badge: "Agent" },
  { id: "customer", label: "Customer", desc: "End User / Client", badge: "Portal" },
];

const PLAN_PRESETS: Record<string, { price: number; storageMb: number; aiRequests: number }> = {
  free: { price: 0, storageMb: 500, aiRequests: 1000 },
  starter: { price: 49, storageMb: 2048, aiRequests: 5000 },
  business: { price: 149, storageMb: 10240, aiRequests: 20000 },
  enterprise: { price: 499, storageMb: 51200, aiRequests: 100000 },
};

export default function OrganizationForm({ organization, onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    organization_id: "",
    name: "",
    domain: "",
    email: "",
    phone: "",
    address: "",
    customPrompt: "",
    plan: "free",
    custom_price: 0,
    custom_storage_mb: 500,
    custom_ai_requests: 1000,
    allowed_registration_roles: ["admin", "branch_admin", "support", "customer"],
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (organization) {
      const plan = (organization.plan as string) || "free";
      const preset = PLAN_PRESETS[plan] || PLAN_PRESETS.free;
      setForm({
        organization_id: organization.organization_id || "",
        name: organization.name || "",
        domain: (organization as any).domain || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
        customPrompt: organization.customPrompt || "",
        plan: plan,
        custom_price: organization.plan_customization?.custom_price ?? preset.price,
        custom_storage_mb: organization.plan_customization?.custom_storage_mb ?? (organization.storage_limit ? Math.round(organization.storage_limit / (1024 * 1024)) : preset.storageMb),
        custom_ai_requests: organization.plan_customization?.custom_ai_requests ?? (organization.ai_requests_limit || preset.aiRequests),
        allowed_registration_roles: organization.allowed_registration_roles && organization.allowed_registration_roles.length > 0
          ? organization.allowed_registration_roles
          : ["admin", "branch_admin", "support", "customer"],
      });
    }
  }, [organization]);

  const validateField = useCallback((name: string, value: string): string => {
    switch (name) {
      case "organization_id":
        return value.trim() ? "" : "Organization ID is required";
      case "name":
        return value.trim() ? "" : "Organization name is required";
      case "email":
        if (!value.trim()) return "Email is required";
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Invalid email format";
      case "phone":
        if (!value) return "";
        return /^[\d\s+\-()]{7,20}$/.test(value) ? "" : "Invalid phone number";
      default:
        return "";
    }
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    ["organization_id", "name", "email"].forEach((field) => {
      const err = validateField(field, (form as any)[field]);
      if (err) newErrors[field as keyof FormErrors] = err;
    });
    if (form.phone) {
      const phoneErr = validateField("phone", form.phone);
      if (phoneErr) newErrors.phone = phoneErr;
    }
    setErrors(newErrors);
    setTouched({ organization_id: true, name: true, email: true, phone: true });
    return Object.keys(newErrors).length === 0;
  }, [form, validateField]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === "plan") {
      const preset = PLAN_PRESETS[value] || PLAN_PRESETS.free;
      setForm((prev) => ({
        ...prev,
        plan: value,
        custom_price: preset.price,
        custom_storage_mb: preset.storageMb,
        custom_ai_requests: preset.aiRequests,
      }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
  };

  const handleToggleRole = (roleId: string) => {
    setForm((prev) => {
      const current = prev.allowed_registration_roles || [];
      const updated = current.includes(roleId)
        ? current.filter((r) => r !== roleId)
        : [...current, roleId];
      return { ...prev, allowed_registration_roles: updated };
    });
  };

  const handleSelectAllRoles = () => {
    setForm((prev) => ({
      ...prev,
      allowed_registration_roles: ["admin", "branch_admin", "support", "customer"],
    }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        organization_id: form.organization_id.trim(),
        name: form.name.trim(),
        domain: form.domain.trim() || undefined,
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        address: form.address.trim() || undefined,
        customPrompt: form.customPrompt.trim() || undefined,
        plan: form.plan,
        allowed_registration_roles: form.allowed_registration_roles,
        storage_limit: Number(form.custom_storage_mb) * 1024 * 1024,
        ai_requests_limit: Number(form.custom_ai_requests),
        plan_customization: {
          custom_price: Number(form.custom_price),
          custom_name: form.plan.toUpperCase(),
          custom_storage_mb: Number(form.custom_storage_mb),
          custom_ai_requests: Number(form.custom_ai_requests),
          features: form.plan === "enterprise" ? ["Full API", "Unlimited AI", "Custom Embeddings"] : ["Standard Support"],
        },
      };
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message || err?.message || "Failed to save organization" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl border max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-bold">{organization ? "Edit Organization" : "Create New Organization"}</h2>
            <p className="text-xs text-muted-foreground">Configure tenant identity, registration access, and subscription plan.</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} noValidate className="overflow-y-auto p-6 space-y-5 flex-1">
          {/* Organization Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Shield size={14} className="text-primary" /> Tenant Identity
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="org-org_id">Organization ID *</Label>
                <Input
                  id="org-org_id"
                  name="organization_id"
                  value={form.organization_id}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. ACME-CORP"
                  className={errors.organization_id && touched.organization_id ? "border-destructive" : ""}
                  aria-invalid={!!errors.organization_id}
                  disabled={!!organization}
                />
                {errors.organization_id && touched.organization_id && (
                  <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={12} />{errors.organization_id}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-name">Organization Name *</Label>
                <Input
                  id="org-name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Acme Corporation"
                  className={errors.name && touched.name ? "border-destructive" : ""}
                  aria-invalid={!!errors.name}
                />
                {errors.name && touched.name && (
                  <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={12} />{errors.name}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="org-email">Admin Email *</Label>
                <Input
                  id="org-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="admin@acme.com"
                  className={errors.email && touched.email ? "border-destructive" : ""}
                  aria-invalid={!!errors.email}
                />
                {errors.email && touched.email && (
                  <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={12} />{errors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-domain">Custom Domain (Optional)</Label>
                <Input
                  id="org-domain"
                  name="domain"
                  value={form.domain}
                  onChange={handleChange}
                  placeholder="acme.com"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="org-phone">Phone Number</Label>
                <Input
                  id="org-phone"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="+1 (555) 000-0000"
                  className={errors.phone && touched.phone ? "border-destructive" : ""}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-address">Address</Label>
                <Input
                  id="org-address"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Section: Allowed Registration Roles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Users size={14} className="text-primary" /> Allowed Self-Registration Roles
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Select which roles users can choose when registering under this organization.
                </p>
              </div>
              <Button type="button" variant="ghost" size="sm" onClick={handleSelectAllRoles} className="text-[11px] h-7 px-2">
                Select All
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_ROLES.map((r) => {
                const isChecked = (form.allowed_registration_roles || []).includes(r.id);
                return (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      isChecked
                        ? "border-primary bg-primary/[0.04] shadow-xs"
                        : "border-border hover:bg-muted/50 opacity-70"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleRole(r.id)}
                      className="mt-0.5 rounded border-muted-foreground text-primary focus:ring-primary h-4 w-4"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-foreground">{r.label}</span>
                        <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-normal">
                          {r.badge}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{r.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-border" />

          {/* Section: Subscription Plan & Resource Limits */}
          <div className="space-y-3.5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CreditCard size={14} className="text-primary" /> Subscription Plan & Quotas
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="org-plan">Pricing Tier</Label>
                <select
                  id="org-plan"
                  name="plan"
                  value={form.plan}
                  onChange={handleChange}
                  className="w-full h-10 px-3 rounded-lg border bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="free">Free Tier ($0/mo)</option>
                  <option value="starter">Starter Plan ($49/mo)</option>
                  <option value="business">Business Plan ($149/mo)</option>
                  <option value="enterprise">Enterprise Plan ($499/mo)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-price">Monthly Price ($)</Label>
                <Input
                  id="org-price"
                  name="custom_price"
                  type="number"
                  min="0"
                  value={form.custom_price}
                  onChange={handleChange}
                  placeholder="49"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <Label htmlFor="org-storage" className="flex items-center gap-1 text-xs">
                  <Database size={12} className="text-primary" /> Storage Limit (MB)
                </Label>
                <Input
                  id="org-storage"
                  name="custom_storage_mb"
                  type="number"
                  min="50"
                  value={form.custom_storage_mb}
                  onChange={handleChange}
                  placeholder="2048"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="org-ai" className="flex items-center gap-1 text-xs">
                  <Bot size={12} className="text-primary" /> AI Requests / Month
                </Label>
                <Input
                  id="org-ai"
                  name="custom_ai_requests"
                  type="number"
                  min="100"
                  value={form.custom_ai_requests}
                  onChange={handleChange}
                  placeholder="5000"
                />
              </div>
            </div>
          </div>

          <hr className="border-border" />

          {/* Custom Prompt */}
          <div className="space-y-1.5">
            <Label htmlFor="org-prompt">Custom AI System Prompt (Optional)</Label>
            <textarea
              id="org-prompt"
              name="customPrompt"
              value={form.customPrompt}
              onChange={handleChange}
              placeholder="Enter custom prompt instructions for this tenant AI assistant..."
              rows={3}
              className="w-full rounded-lg border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
            />
            <p className="text-[11px] text-muted-foreground">Use {'{ORGANIZATION_NAME}'} as a placeholder token.</p>
          </div>

          {errors.submit && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-xs text-destructive flex items-center gap-2" role="alert">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : organization ? "Update Organization" : "Create Organization"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
