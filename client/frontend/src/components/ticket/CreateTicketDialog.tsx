import { useState, useCallback, useEffect, memo } from "react";
import { X, Loader2, AlertCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useTickets } from "@/hooks/useTickets";
import { useSelector } from "react-redux";
import { useToast } from "@/components/ui/toast";
import { TicketTemplateAPI } from "@/api";
import type { RootState } from "@/store/store";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-primary/10 text-primary" },
  { value: "medium", label: "Medium", color: "bg-accent text-accent-foreground" },
  { value: "high", label: "High", color: "bg-secondary/10 text-secondary" },
  { value: "urgent", label: "Urgent", color: "bg-destructive/10 text-destructive" },
];

interface CreateTicketDialogProps {
  open: boolean;
  onClose: () => void;
}

interface FormErrors {
  subject?: string;
  description?: string;
}

const CreateTicketDialog = memo(function CreateTicketDialog({ open, onClose }: CreateTicketDialogProps) {
  const { user } = useSelector((state: RootState) => state.user);
  const { addTicket, creating } = useTickets();
  const toast = useToast();

  const [form, setForm] = useState({ subject: "", description: "", priority: "medium" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm({ subject: "", description: "", priority: "medium" });
      setErrors({});
      setTouched({});
      setSelectedTemplate(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await TicketTemplateAPI.getActive();
        if (res.data.success && Array.isArray(res.data.data)) {
          setTemplates(res.data.data);
        }
      } catch {
        // silently fail
      }
    })();
  }, [open]);

  const applyTemplate = useCallback((template: any) => {
    setSelectedTemplate(template._id);
    setForm({
      subject: template.default_subject || "",
      description: template.default_description || "",
      priority: template.default_priority || "medium",
    });
    setTouched({});
    setErrors({});
  }, []);

  const validateField = useCallback((field: string, value: string): string => {
    switch (field) {
      case "subject":
        if (!value.trim()) return "Subject is required";
        if (value.length > 255) return "Subject must be under 255 characters";
        return "";
      case "description":
        if (!value.trim()) return "Description is required";
        if (value.length < 10) return "Please provide at least 10 characters";
        return "";
      default:
        return "";
    }
  }, []);

  const handleChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (touched[field]) {
      setErrors((prev) => ({ ...prev, [field]: validateField(field, value) }));
    }
  }, [touched, validateField]);

  const handleBlur = useCallback((field: string) => (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors((prev) => ({ ...prev, [field]: validateField(field, e.target.value) }));
  }, [validateField]);

  const validate = useCallback((): boolean => {
    const newErrors: FormErrors = {};
    const subjectErr = validateField("subject", form.subject);
    if (subjectErr) newErrors.subject = subjectErr;
    const descErr = validateField("description", form.description);
    if (descErr) newErrors.description = descErr;
    setErrors(newErrors);
    setTouched({ subject: true, description: true });
    return Object.keys(newErrors).length === 0;
  }, [form, validateField]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      user_id: user?._id,
      organization_id: user?.organization_id?._id || user?.organization_id,
      subject: form.subject.trim(),
      description: form.description.trim(),
      priority: form.priority,
    };

    try {
      await addTicket(payload).unwrap();
      toast.success("Ticket Created", "We'll review your request shortly");
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to create ticket";
      toast.error("Error", msg);
    }
  }, [form, user, addTicket, onClose, validate, toast]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="ticket-dialog-title">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-background dark:bg-card/95 dark:backdrop-blur-md rounded-xl shadow-xl border dark:border-white/[0.06] animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.06]">
          <div>
            <h2 id="ticket-dialog-title" className="text-base font-semibold">Create Ticket</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Describe your issue and we'll get back to you</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted dark:hover:bg-white/[0.06] text-muted-foreground" aria-label="Close dialog">
            <X size={15} />
          </button>
        </div>

          <form onSubmit={handleSubmit} noValidate className="p-5 space-y-4">

            {templates.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Quick fill from template</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {templates.map(t => (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => applyTemplate(t)}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all",
                        selectedTemplate === t._id
                          ? "bg-primary/10 text-primary ring-1 ring-primary/30"
                          : "bg-muted dark:bg-white/[0.06] text-muted-foreground hover:bg-muted/80"
                      )}
                    >
                      <FileText size={12} />
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ticket-subject">Subject</Label>
              <Input
                id="ticket-subject"
                value={form.subject}
                onChange={handleChange("subject")}
                onBlur={handleBlur("subject")}
                placeholder="Brief summary of the issue"
                className={cn("dark:border-white/[0.06]", errors.subject && touched.subject ? "border-destructive" : "")}
                aria-invalid={!!(errors.subject && touched.subject)}
                aria-describedby={errors.subject ? "subject-error" : undefined}
              />
              {errors.subject && touched.subject && (
                <p id="subject-error" className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.subject}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-desc">Description</Label>
              <textarea
                id="ticket-desc"
                value={form.description}
                onChange={handleChange("description")}
                onBlur={handleBlur("description")}
                placeholder="Provide details about your problem... (at least 10 characters)"
                rows={4}
                className={cn("w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y min-h-[80px]", errors.description && touched.description ? "border-destructive" : "dark:border-white/[0.06]")}
                aria-invalid={!!(errors.description && touched.description)}
                aria-describedby={errors.description ? "desc-error" : undefined}
              />
              {errors.description && touched.description && (
                <p id="desc-error" className="text-xs text-destructive flex items-center gap-1" role="alert"><AlertCircle size={12} />{errors.description}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <div className="flex gap-1.5 flex-wrap" role="radiogroup" aria-label="Priority selection">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    role="radio"
                    aria-checked={form.priority === opt.value}
                    onClick={() => setForm((prev) => ({ ...prev, priority: opt.value }))}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
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

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose} className="flex-1 dark:border-white/[0.06]">Cancel</Button>
              <Button type="submit" disabled={creating} className="flex-1">
                {creating ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                {creating ? "Creating..." : "Create Ticket"}
              </Button>
            </div>
          </form>
      </div>
    </div>
  );
});

export default CreateTicketDialog;
