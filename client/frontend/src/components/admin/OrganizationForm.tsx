import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, X } from "lucide-react";
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

export default function OrganizationForm({ organization, onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    organization_id: "",
    name: "",
    email: "",
    phone: "",
    address: "",
    customPrompt: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (organization) {
      setForm({
        organization_id: organization.organization_id || "",
        name: organization.name || "",
        email: organization.email || "",
        phone: organization.phone || "",
        address: organization.address || "",
        customPrompt: organization.customPrompt || "",
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
      const err = validateField(field, form[field as keyof typeof form]);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
    }
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
      await onSubmit(form);
      onClose();
    } catch (err: any) {
      setErrors({ submit: err?.response?.data?.message || err?.message || "Failed to save organization" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-xl shadow-2xl border max-w-lg w-full max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">{organization ? "Edit Organization" : "Create Organization"}</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="org-org_id">Organization ID</Label>
            <Input
              id="org-org_id"
              name="organization_id"
              value={form.organization_id}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="ORG-001"
              className={errors.organization_id && touched.organization_id ? "border-destructive" : ""}
              aria-invalid={!!errors.organization_id}
              aria-describedby={errors.organization_id ? "org-id-error" : undefined}
            />
            {errors.organization_id && touched.organization_id && (
              <p id="org-id-error" className="text-xs text-destructive flex items-center gap-1" role="alert">
                <AlertCircle size={12} />{errors.organization_id}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-name">Name</Label>
            <Input
              id="org-name"
              name="name"
              value={form.name}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Organization name"
              className={errors.name && touched.name ? "border-destructive" : ""}
              aria-invalid={!!errors.name}
            />
            {errors.name && touched.name && (
              <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                <AlertCircle size={12} />{errors.name}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-email">Email</Label>
            <Input
              id="org-email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="org@example.com"
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
            <Label htmlFor="org-phone">Phone</Label>
            <Input
              id="org-phone"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="Phone number"
              className={errors.phone && touched.phone ? "border-destructive" : ""}
            />
            {errors.phone && touched.phone && (
              <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                <AlertCircle size={12} />{errors.phone}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-address">Address</Label>
            <Input
              id="org-address"
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Address"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="org-prompt">Custom Prompt</Label>
            <textarea
              id="org-prompt"
              name="customPrompt"
              value={form.customPrompt}
              onChange={handleChange}
              placeholder="Enter custom system prompt for this organization (leave empty to use default)"
              rows={4}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y dark:border-white/[0.06]"
            />
            <p className="text-xs text-muted-foreground">Use {'{ORGANIZATION_NAME}'} as a placeholder.</p>
          </div>

          {errors.submit && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive flex items-center gap-2" role="alert">
              <AlertCircle size={14} />{errors.submit}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
            <Button type="submit" disabled={submitting} className="flex-1">
              {submitting ? "Saving..." : organization ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
