import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminAPI } from "@/api/admin.api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft, MessageSquare, Loader2, User,
  Building2, AlertCircle, Headphones
} from "lucide-react";

interface ChatMessage {
  _id: string;
  sender_id: { _id: string; name: string; email: string };
  content: string;
  message_type: string;
  is_ai: boolean;
  created_at: string;
}

interface ChatDetail {
  _id: string;
  user_id: { _id: string; name: string; email: string };
  organization_id: { _id: string; name: string };
  topic: string;
  status: "open" | "closed";
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export default function SuperAdminChatHistoryView() {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chat, setChat] = useState<ChatDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!chatId) return;
    (async () => {
      setLoading(true);
      setError(false);
      try {
        const res = await AdminAPI.getChatDetail(chatId);
        if (res.data.success) {
          setChat(res.data.data);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, [chatId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-muted-foreground">
        <Loader2 size={20} className="animate-spin mr-2" />
        Loading conversation transcript...
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center px-4">
        <AlertCircle size={40} className="text-muted-foreground/50 mb-3" />
        <p className="text-sm font-medium text-foreground">Conversation not found</p>
        <p className="text-xs text-muted-foreground mt-1 mb-4">This chat may have been deleted or you may not have access.</p>
        <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
          <ArrowLeft size={14} className="mr-1" /> Go back
        </Button>
      </div>
    );
  }

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const formatTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit",
    });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => navigate("/superadmin/chat-history")} className="gap-1.5 text-muted-foreground">
          <ArrowLeft size={14} />
          Back to Chat History
        </Button>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <MessageSquare size={20} className="text-primary shrink-0" />
              {chat.topic || "Untitled Chat"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <User size={13} />
                {chat.user_id?.name || "Deleted User"}
              </span>
              {chat.organization_id?.name && (
                <span className="flex items-center gap-1">
                  <Building2 size={13} />
                  {chat.organization_id.name}
                </span>
              )}
              <span className="flex items-center gap-1 text-xs">
                {chat.messages.length} message{chat.messages.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>
          <span className={cn(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold shrink-0",
            chat.status === "open"
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "bg-muted text-muted-foreground"
          )}>
            {chat.status}
          </span>
        </div>
      </div>

      <div className="space-y-1">
        {chat.messages.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
            <p>No messages in this chat session.</p>
          </div>
        ) : (
          chat.messages.map((msg, idx) => {
            const isAI = msg.is_ai;
            const showDateHeader = idx === 0 || (
              new Date(msg.created_at).toDateString() !==
              new Date(chat.messages[idx - 1].created_at).toDateString()
            );

            return (
              <div key={msg._id}>
                {showDateHeader && (
                  <div className="flex items-center gap-2 py-4">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      {new Date(msg.created_at).toLocaleDateString("en-US", {
                        weekday: "long", month: "long", day: "numeric", year: "numeric"
                      })}
                    </span>
                    <div className="flex-1 h-px bg-border" />
                  </div>
                )}

                <div className={cn(
                  "flex gap-3 px-4 py-4 rounded-lg transition-colors",
                  isAI && "bg-muted/30 dark:bg-white/[0.02]"
                )}>
                  <div className={cn(
                    "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5",
                    isAI
                      ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm shadow-primary/20"
                      : "bg-muted dark:bg-white/[0.06] text-muted-foreground"
                  )}>
                    {isAI ? <Headphones size={15} /> : <User size={15} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold">
                        {isAI ? "AI Support Bot" : msg.sender_id?.name || "User"}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 font-mono">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="text-center text-[10px] text-muted-foreground/40 pt-4 border-t">
        Chat started {formatDate(chat.created_at)}
        {chat.updated_at !== chat.created_at && <> &middot; Last activity {formatDate(chat.updated_at)}</>}
      </div>
    </div>
  );
}
