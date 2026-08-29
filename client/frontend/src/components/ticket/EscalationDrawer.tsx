import { useState, useCallback, useEffect } from "react";
import { X, Loader2, LifeBuoy, AlertCircle, CheckCircle2, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuthContext } from "@/context/AuthContext";
import { useToast } from "@/components/ui/toast";
import { TicketAPI } from "@/api";

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  { value: "medium", label: "Medium", color: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  { value: "high", label: "High", color: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
  { value: "urgent", label: "Urgent", color: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
];

const CATEGORY_OPTIONS = [
  "General Inquiry",
  "Technical Issue",
  "Billing & Payment",
  "Account & Access",
  "Feature Request",
  "Other"
];

interface EscalationDrawerProps {
  open: boolean;
  onClose: () => void;
  chatId: string;
  conversationSnippet?: string;
  onEscalated?: () => void;
}

export default function EscalationDrawer({
  open,
  onClose,
  chatId,
  conversationSnippet,
  onEscalated,
}: EscalationDrawerProps) {
  const { user } = useAuthContext();
  const toast = useToast();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Technical Issue");
  const [priority, setPriority] = useState("high");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  useEffect(() => {
    if (open) {
      setSubject(`Escalated Support Case - ${new Date().toLocaleDateString()}`);
      setNotes(conversationSnippet || "");
      setPriority("high");
      setCategory("Technical Issue");
    }
  }, [open, conversationSnippet]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatId || submitting) return;

      setSubmitting(true);
      try {
        await TicketAPI.escalateFromChat({
          chatId,
          subject: subject.trim() || "Escalated AI Support Case",
          category,
          priority,
          notes: notes.trim(),
        });
        toast.success("Success", "Conversation successfully escalated to support ticket");
        onEscalated?.();
        onClose();
      } catch (err: any) {
        toast.error("Escalation Failed", err?.response?.data?.message || err?.message || "Failed to escalate conversation");
      } finally {
        setSubmitting(false);
      }
    },
    [chatId, subject, category, priority, notes, submitting, toast, onEscalated, onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className={`relative bg-card border-l border-border h-full flex flex-col shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-right ${
          isFullScreen ? "w-full max-w-full" : "w-full max-w-lg"
        }`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/20 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <LifeBuoy size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground leading-tight">Escalate to Support Ticket</h2>
              <p className="text-[11px] text-muted-foreground">Convert active AI transcript into a live support incident</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsFullScreen((prev) => !prev)}
              title={isFullScreen ? "Exit Full Screen" : "Expand to Full Screen"}
              aria-label={isFullScreen ? "Exit Full Screen" : "Expand to Full Screen"}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Customer Summary Card */}
          <div className="p-4 rounded-xl bg-muted/40 border border-border/80 space-y-2 text-xs">
            <div className="flex items-center justify-between text-muted-foreground font-semibold">
              <span>Customer Info</span>
              <span className="text-emerald-500 font-mono text-[11px] flex items-center gap-1">
                <CheckCircle2 size={12} /> Active User
              </span>
            </div>
            <p className="text-foreground font-medium">{user?.name || "Customer"}</p>
            <p className="text-muted-foreground">{user?.email || "No email"}</p>
          </div>

          {/* Incident Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Ticket Subject</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue..."
              required
              className="bg-background"
            />
          </div>

          {/* Category & Priority Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">Priority</Label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {PRIORITY_OPTIONS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label} Priority
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conversation Summary Preview */}
          <div className="space-y-1.5 flex-1 flex flex-col min-h-0">
            <Label className="text-xs font-semibold text-foreground">AI Conversation Context</Label>
            <div className={`p-3 rounded-xl bg-background border border-border text-xs text-muted-foreground overflow-y-auto leading-relaxed whitespace-pre-wrap ${
              isFullScreen ? "min-h-[240px] max-h-[60vh]" : "max-h-36"
            }`}>
              {notes || "Active conversation transcript will be automatically attached to this ticket for live support agent review."}
            </div>
          </div>

          {/* Info callout */}
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2 text-amber-600 dark:text-amber-400 text-xs leading-relaxed">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <span>
              Submitting will automatically route this case to the branch support queue with high-priority SLA tracking.
            </span>
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="gap-2" disabled={submitting}>
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <LifeBuoy size={14} />}
              Confirm Escalation
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
