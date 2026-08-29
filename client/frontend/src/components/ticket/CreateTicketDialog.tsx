import { useState, useCallback, useEffect, memo } from "react";
import { X, Loader2, AlertCircle, FileText, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTickets } from "@/hooks/useTickets";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { TicketTemplateAPI } from "@/api";
import AxiosInstance from "@/api/axiosInstance";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-primary/10 text-primary" },
  { value: "medium", label: "Medium", color: "bg-accent text-accent-foreground" },
  { value: "high", label: "High", color: "bg-secondary/10 text-secondary" },
  { value: "urgent", label: "Urgent", color: "bg-destructive/10 text-destructive" },
];

interface FormFieldConfig {
  field_key: string;
  label: string;
  enabled: boolean;
  required: boolean;
  order: number;
}

const DEFAULT_FIELDS: FormFieldConfig[] = [
  { field_key: "subject", label: "Subject", enabled: true, required: true, order: 1 },
  { field_key: "description", label: "Description", enabled: true, required: true, order: 2 },
  { field_key: "category", label: "Category", enabled: true, required: true, order: 3 },
  { field_key: "priority", label: "Priority", enabled: true, required: false, order: 4 },
  { field_key: "attachment", label: "Attachment", enabled: true, required: false, order: 5 },
  { field_key: "phone", label: "Phone Number", enabled: false, required: false, order: 6 },
  { field_key: "order_id", label: "Order ID", enabled: false, required: false, order: 7 },
];

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
}

const CreateTicketDialog = memo(function CreateTicketDialog({ open, onClose }: CreateTicketDialogProps) {
  const { user } = useAuthContext();
  const { addTicket, creating } = useTickets();
  const toast = useToast();

  const [formConfig, setFormConfig] = useState<FormFieldConfig[]>(DEFAULT_FIELDS);
  const [form, setForm] = useState<Record<string, any>>({
    subject: "",
    description: "",
    category: "technical_issue",
    priority: "medium",
    phone: "",
    order_id: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm({
        subject: "",
        description: "",
        category: "technical_issue",
        priority: "medium",
        phone: "",
        order_id: "",
      });
      setErrors({});
      setTouched({});
      setSelectedTemplate(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const [templateRes, settingsRes] = await Promise.allSettled([
          TicketTemplateAPI.getActive(),
          AxiosInstance.get("/admin/v1/settings"),
        ]);

        if (templateRes.status === "fulfilled" && templateRes.value.data?.success && Array.isArray(templateRes.value.data.data)) {
          setTemplates(templateRes.value.data.data);
        }

        if (settingsRes.status === "fulfilled" && settingsRes.value.data?.success && Array.isArray(settingsRes.value.data.data?.ticket_form_config)) {
          setFormConfig(settingsRes.value.data.data.ticket_form_config.sort((a: any, b: any) => a.order - b.order));
        }
      } catch {
        // Fall back gracefully
      }
    })();
  }, [open]);

  const [activeMode, setActiveMode] = useState<"form" | "templates">("form");

  const applyTemplate = useCallback((template: any) => {
    setSelectedTemplate(template._id);
    setForm((prev) => ({
      ...prev,
      subject: template.default_subject || prev.subject,
      description: template.default_description || prev.description,
      priority: template.default_priority || prev.priority,
      category: template.category || prev.category,
    }));
    setTouched({});
    setErrors({});
    setActiveMode("form");
    toast.success("Template Applied", `Pre-filled form with "${template.name}"`);
  }, [toast]);

  const validateField = useCallback((fieldKey: string, value: string, isRequired: boolean, label: string): string => {
    if (isRequired && !String(value || "").trim()) {
      return `${label} is required`;
    }
    if (fieldKey === "description" && value && value.length < 10) {
      return "Please provide at least 10 characters";
    }
    return "";
  }, []);

  const handleChange = useCallback((fieldKey: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [fieldKey]: value }));
    const cfg = formConfig.find((f) => f.field_key === fieldKey);
    if (touched[fieldKey] && cfg) {
      setErrors((prev) => ({ ...prev, [fieldKey]: validateField(fieldKey, value, cfg.required, cfg.label) }));
    }
  }, [touched, formConfig, validateField]);

  const handleBlur = useCallback((fieldKey: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setTouched((prev) => ({ ...prev, [fieldKey]: true }));
    const cfg = formConfig.find((f) => f.field_key === fieldKey);
    if (cfg) {
      setErrors((prev) => ({ ...prev, [fieldKey]: validateField(fieldKey, e.target.value, cfg.required, cfg.label) }));
    }
  }, [formConfig, validateField]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    const enabledFields = formConfig.filter((f) => f.enabled);

    enabledFields.forEach((cfg) => {
      const val = form[cfg.field_key] || "";
      const err = validateField(cfg.field_key, val, cfg.required, cfg.label);
      if (err) newErrors[cfg.field_key] = err;
    });

    setErrors(newErrors);
    const newTouched: Record<string, boolean> = {};
    enabledFields.forEach((f) => { newTouched[f.field_key] = true; });
    setTouched(newTouched);

    return Object.keys(newErrors).length === 0;
  }, [formConfig, form, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const customFields: Record<string, any> = {};
    Object.keys(form).forEach((k) => {
      if (k.startsWith("custom_") || k === "phone" || k === "order_id") {
        if (form[k]) customFields[k] = form[k];
      }
    });

    const payload: Record<string, any> = {
      subject: (form.subject || "").trim(),
      description: (form.description || "").trim(),
      category: form.category || "technical_issue",
      priority: form.priority || "medium",
    };

    if (Object.keys(customFields).length > 0) {
      payload.custom_fields = customFields;
      if (form.phone) payload.phone = form.phone;
      if (form.order_id) payload.order_id = form.order_id;
    }

    const userId = user?._id || user?.userId || user?.id;
    if (userId) payload.user_id = String(userId);

    const orgId = typeof user?.organization_id === "object"
      ? user?.organization_id?._id
      : user?.organization_id || user?.organizationId;
    if (orgId) payload.organization_id = String(orgId);

    try {
      await addTicket(payload);
      toast.success("Ticket Created", "We'll review your request shortly");
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      const msg =
        err?.response?.data?.errors?.[0]?.message ||
        err?.response?.data?.message ||
        (typeof err === "string" ? err : err?.message) ||
        "Failed to create ticket";
      toast.error("Error", msg);
    }
  }, [form, user, addTicket, onClose, validate, toast]);

  if (!open) return null;

  const enabledFields = formConfig.filter((f) => f.enabled);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ticket-dialog-title">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-background dark:bg-card/95 dark:backdrop-blur-md rounded-xl shadow-xl border dark:border-white/[0.06] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.06]">
          <div>
            <h2 id="ticket-dialog-title" className="text-base font-semibold">Create Ticket</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Submit a new ticket form or select a template</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-white/[0.06] text-muted-foreground" aria-label="Close dialog">
            <X size={15} />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="px-5 pt-3 pb-1 flex border-b dark:border-white/[0.06] bg-muted/20">
          <button
            type="button"
            onClick={() => setActiveMode("form")}
            className={cn(
              "flex-1 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5",
              activeMode === "form"
                ? "border-primary text-primary font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText size={14} /> New Ticket Form
          </button>
          <button
            type="button"
            onClick={() => setActiveMode("templates")}
            className={cn(
              "flex-1 py-2 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-1.5",
              activeMode === "templates"
                ? "border-orange-500 text-orange-500 font-bold"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            <FileText size={14} /> Ticket Templates {templates.length > 0 && `(${templates.length})`}
          </button>
        </div>

        {activeMode === "templates" ? (
          /* TICKET TEMPLATES CATALOG VIEW */
          <div className="p-5 space-y-3">
            <div className="text-xs text-muted-foreground mb-2">
              Select a pre-configured ticket template to pre-fill subject, category, description, and priority:
            </div>
            {templates.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                No active ticket templates configured.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {templates.map((t) => (
                  <div
                    key={t._id}
                    onClick={() => applyTemplate(t)}
                    className="p-3.5 rounded-xl border dark:border-white/[0.08] bg-card hover:bg-muted/40 transition-all cursor-pointer space-y-1.5 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors flex items-center gap-1.5">
                        <FileText size={14} className="text-orange-500" /> {t.name}
                      </span>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-orange-500/10 text-orange-500 border border-orange-500/20">
                        {t.default_priority || "MEDIUM"}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground line-clamp-1">{t.default_subject}</p>
                    <div className="text-[10px] text-primary font-medium flex items-center gap-1 pt-1">
                      Use Template →
                    </div>
                  </div>
                ))}
              </div>
            )}
            <Button variant="outline" onClick={() => setActiveMode("form")} className="w-full mt-3 h-8 text-xs">
              Back to Custom Ticket Form
            </Button>
          </div>
        ) : (
          /* CUSTOM TICKET FORM VIEW */
          <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">

          {enabledFields.map((field) => {
            const key = field.field_key;
            const isErr = !!(errors[key] && touched[key]);

            if (key === "subject") {
              return (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor="ticket-subject" className="text-xs font-medium flex items-center gap-1">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <Input
                    id="ticket-subject"
                    value={form.subject || ""}
                    onChange={handleChange("subject")}
                    onBlur={handleBlur("subject")}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    className={cn("dark:border-white/[0.06]", isErr ? "border-destructive" : "")}
                  />
                  {isErr && (
                    <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                      <AlertCircle size={12} />
                      {errors.subject}
                    </p>
                  )}
                </div>
              );
            }

            if (key === "description") {
              return (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor="ticket-desc" className="text-xs font-medium flex items-center gap-1">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <textarea
                    id="ticket-desc"
                    value={form.description || ""}
                    onChange={handleChange("description")}
                    onBlur={handleBlur("description")}
                    placeholder={`Enter ${field.label.toLowerCase()}...`}
                    rows={4}
                    className={cn(
                      "w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[80px]",
                      isErr ? "border-destructive" : "dark:border-white/[0.06]"
                    )}
                  />
                  {isErr && (
                    <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                      <AlertCircle size={12} />
                      {errors.description}
                    </p>
                  )}
                </div>
              );
            }

            if (key === "category") {
              return (
                <div key={key} className="space-y-1.5">
                  <Label htmlFor="ticket-category" className="text-xs font-medium flex items-center gap-1">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <select
                    id="ticket-category"
                    value={form.category || "technical_issue"}
                    onChange={handleChange("category")}
                    className="w-full rounded-lg border dark:border-white/[0.06] bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="technical_issue">Technical Support</option>
                    <option value="question">General Inquiry</option>
                    <option value="billing">Billing & Payment</option>
                    <option value="account">Account & Access</option>
                    <option value="bug">Bug Report</option>
                    <option value="feature_request">Feature Request</option>
                    <option value="complaint">Complaint</option>
                    <option value="refund">Refund Request</option>
                    <option value="sales_inquiry">Sales Inquiry</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              );
            }

            if (key === "priority") {
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="flex gap-1.5 flex-wrap" role="radiogroup">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={form.priority === opt.value}
                        onClick={() => setForm((prev) => ({ ...prev, priority: opt.value }))}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium transition-all focus:outline-none",
                          form.priority === opt.value
                            ? opt.color + " ring-1 ring-current/20"
                            : "bg-muted dark:bg-white/[0.06] text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            }

            if (key === "attachment") {
              return (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1">
                    {field.label} {field.required && <span className="text-destructive">*</span>}
                  </Label>
                  <div className="border border-dashed border-border dark:border-white/[0.08] rounded-lg p-3 text-center bg-muted/20">
                    <Paperclip className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-xs text-muted-foreground">Attach images or files (Optional)</p>
                  </div>
                </div>
              );
            }

            return (
              <div key={key} className="space-y-1.5">
                <Label htmlFor={`ticket-${key}`} className="text-xs font-medium flex items-center gap-1">
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                <Input
                  id={`ticket-${key}`}
                  value={form[key] || ""}
                  onChange={handleChange(key)}
                  onBlur={handleBlur(key)}
                  placeholder={`Enter ${field.label.toLowerCase()}...`}
                  className={cn("dark:border-white/[0.06]", isErr ? "border-destructive" : "")}
                />
                {isErr && (
                  <p className="text-xs text-destructive flex items-center gap-1" role="alert">
                    <AlertCircle size={12} />
                    {errors[key]}
                  </p>
                )}
              </div>
            );
          })}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 dark:border-white/[0.06]">
              Cancel
            </Button>
            <Button type="submit" disabled={creating} className="flex-1">
              {creating ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              {creating ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
});

export default CreateTicketDialog;
