import { useState, useCallback, useEffect, memo } from "react";
import { X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useTickets } from "@/hooks/useTickets";
import { useSelector } from "react-redux";
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

const CreateTicketDialog = memo(function CreateTicketDialog({ open, onClose }: CreateTicketDialogProps) {
  const { user } = useSelector((state: RootState) => state.user);
  const { addTicket, creating } = useTickets();

  const [form, setForm] = useState({ subject: "", description: "", priority: "medium" });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setForm({ subject: "", description: "", priority: "medium" });
      setSuccess(false);
      setError(null);
    }
  }, [open]);

  const handleChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.description.trim()) return;

    const payload = {
      user_id: user?._id,
      organization_id: user?.organization_id?._id || user?.organization_id,
      subject: form.subject.trim(),
      description: form.description.trim(),
      priority: form.priority,
    };
    console.log("Creating ticket with payload:", payload);

    try {
      await addTicket(payload).unwrap();
      setSuccess(true);
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      const msg = typeof err === "string" ? err : err?.message || "Failed to create ticket";
      console.error("Ticket creation error:", err);
      setError(msg);
    }
  }, [form, user, addTicket, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 bg-background dark:bg-card/95 dark:backdrop-blur-md rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/10 border dark:border-white/[0.06] animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold">Create Ticket</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Describe your issue and we'll get back to you</p>
          </div>
          <Button variant="ghost" size="icon-xs" onClick={onClose} className="text-muted-foreground hover:text-foreground dark:hover:bg-white/[0.06]">
            <X size={15} />
          </Button>
        </div>

        {success ? (
          <div className="flex flex-col items-center py-10 px-5">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/15 to-secondary/10 dark:from-primary/20 dark:to-secondary/10 flex items-center justify-center mb-3">
              <CheckCircle2 size={20} className="text-primary" />
            </div>
            <p className="text-sm font-medium">Ticket Created</p>
            <p className="text-xs text-muted-foreground mt-1">We'll review your request shortly</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg bg-destructive/10 dark:bg-destructive/15 px-3 py-2 text-xs text-destructive">
                <AlertCircle size={13} />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ticket-subject">Subject</Label>
              <Input
                id="ticket-subject"
                value={form.subject}
                onChange={handleChange("subject")}
                placeholder="Brief summary of the issue"
                className="dark:border-white/[0.06] dark:focus:border-primary/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-desc">Description</Label>
              <Textarea
                id="ticket-desc"
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Provide details about your problem..."
                rows={3}
                className="dark:border-white/[0.06] dark:focus:border-primary/40"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Priority</Label>
              <div className="flex gap-1.5">
                {PRIORITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, priority: opt.value }))}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                      form.priority === opt.value
                        ? opt.color + " ring-1 ring-current/20"
                        : "bg-muted dark:bg-white/[0.06] text-muted-foreground hover:bg-muted/80 dark:hover:bg-white/[0.06]"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={onClose} className="flex-1 dark:border-white/[0.06] dark:hover:bg-white/[0.04]">
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={creating || !form.subject.trim() || !form.description.trim()} className="flex-1 dark:bg-primary dark:hover:bg-primary/90 dark:shadow-sm dark:shadow-primary/20">
                {creating ? <Loader2 size={14} className="animate-spin" /> : "Create Ticket"}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
});

export default CreateTicketDialog;
