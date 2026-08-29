import React from "react";
import { User, Sparkles, ShieldCheck, Lock } from "lucide-react";

interface SupportMessageProps {
  message: {
    _id?: string;
    sender_id?: any;
    content: string;
    is_ai?: boolean;
    is_internal_note?: boolean;
    created_at?: string;
    sender_name?: string;
    sender_role?: string;
  };
  currentUserId?: string;
  isCustomerView?: boolean;
}

export const SupportMessage: React.FC<SupportMessageProps> = ({
  message,
  currentUserId,
  isCustomerView = false,
}) => {
  // If internal note and customer view, hide completely!
  if (message.is_internal_note && isCustomerView) {
    return null;
  }

  const isOwn =
    message.sender_id === currentUserId || message.sender_id?._id === currentUserId;
  const isAI = message.is_ai;

  return (
    <div
      className={`flex flex-col ${
        isOwn ? "items-end ml-auto" : "items-start mr-auto"
      } max-w-2xl w-full mb-3`}
    >
      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1 px-1">
        <span>
          {isAI
            ? "🤖 AI Support Agent"
            : message.is_internal_note
            ? "🔒 Internal Note"
            : message.sender_name || (isOwn ? "You" : "User")}
        </span>
        {message.sender_role && !isAI && (
          <span className="opacity-70">({message.sender_role})</span>
        )}
        <span>·</span>
        <span>
          {message.created_at
            ? new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </span>
      </div>

      <div
        className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
          message.is_internal_note
            ? "bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-100 italic"
            : isAI
            ? "bg-slate-100 dark:bg-slate-800 border text-foreground"
            : isOwn
            ? "bg-primary text-primary-foreground font-medium"
            : "bg-card border text-foreground"
        }`}
      >
        {message.content}
      </div>
    </div>
  );
};
