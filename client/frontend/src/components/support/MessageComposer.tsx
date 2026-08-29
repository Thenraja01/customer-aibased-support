import React, { useState } from "react";
import { Send, Lock, Eye, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SupportPermissions } from "@/config/supportPermissions";

interface MessageComposerProps {
  permissions: SupportPermissions;
  onSendPublicMessage: (content: string) => Promise<void>;
  onAddInternalNote: (content: string) => Promise<void>;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  permissions,
  onSendPublicMessage,
  onAddInternalNote,
  disabled = false,
}) => {
  const [activeMode, setActiveMode] = useState<"public" | "internal">(
    permissions.replyToCustomer ? "public" : "internal"
  );
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim() || submitting || disabled) return;
    const content = text.trim();
    setText("");
    setSubmitting(true);

    try {
      if (activeMode === "internal" && permissions.addInternalNote) {
        await onAddInternalNote(content);
      } else if (permissions.replyToCustomer) {
        await onSendPublicMessage(content);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-3 border-t bg-card/60 backdrop-blur space-y-2">
      {/* Mode Selector Tabs */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg text-xs font-semibold">
          {permissions.replyToCustomer ? (
            <button
              type="button"
              onClick={() => setActiveMode("public")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                activeMode === "public"
                  ? "bg-primary text-primary-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare size={12} />
              <span>Reply to Customer</span>
            </button>
          ) : (
            <div className="px-2.5 py-1 text-[11px] text-muted-foreground flex items-center gap-1 font-semibold">
              <Eye size={12} className="text-amber-500" />
              <span>Supervisory Mode</span>
            </div>
          )}

          {permissions.addInternalNote && (
            <button
              type="button"
              onClick={() => setActiveMode("internal")}
              className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1.5 ${
                activeMode === "internal"
                  ? "bg-amber-500 text-slate-950 font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Lock size={12} />
              <span>Internal Note</span>
            </button>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground font-medium">
          {activeMode === "internal"
            ? "🔒 Visible to Staff Only"
            : "💬 Visible to Customer"}
        </span>
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          disabled={disabled || submitting}
          placeholder={
            activeMode === "internal"
              ? "Type internal note for team..."
              : permissions.replyToCustomer
              ? "Type message to customer..."
              : "Read-only supervisory view..."
          }
          className={`flex-1 border rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 ${
            activeMode === "internal"
              ? "bg-amber-500/5 border-amber-500/30 focus:ring-amber-500/20"
              : "bg-background focus:ring-primary/20"
          }`}
        />
        <Button
          onClick={handleSubmit}
          disabled={disabled || submitting || !text.trim()}
          size="sm"
          className={`gap-1.5 font-bold shadow-sm ${
            activeMode === "internal"
              ? "bg-amber-500 hover:bg-amber-600 text-slate-950"
              : "bg-primary hover:bg-primary/90 text-primary-foreground"
          }`}
        >
          <Send size={14} />
          {activeMode === "internal" ? "Add Note" : "Send"}
        </Button>
      </div>
    </div>
  );
};
