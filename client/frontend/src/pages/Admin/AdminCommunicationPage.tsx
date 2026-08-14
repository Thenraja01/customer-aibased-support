import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, Loader2, Check, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunicationAPI } from "@/api/communication.api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";

interface Message {
  _id: string;
  sender_id: { _id: string; name: string; email: string };
  message: string;
  status: "sent" | "seen";
  seen_at: string | null;
  created_at: string;
}

export default function AdminCommunicationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      const res = await CommunicationAPI.getMyOrgMessages();
      if (res.data.success) {
        setMessages(res.data.data);
      }
      markAllAsSeen();
    } catch {
      toast.error("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const currentUserId = user?._id || user?.userId;

  const markAllAsSeen = async () => {
    try {
      const orgId = user?.organization_id?._id || user?.organization_id;
      if (orgId) {
        await CommunicationAPI.markOrgSeen(orgId);
        setMessages((prev) =>
          prev.map((m) => {
            const senderIdStr = typeof m.sender_id === "object" ? m.sender_id?._id : m.sender_id;
            return senderIdStr !== currentUserId && m.status === "sent"
              ? { ...m, status: "seen" as const }
              : m;
          })
        );
      }
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const res = await CommunicationAPI.sendToOrg({
        organization_id: user?.organization_id?._id || user?.organization_id,
        message: input.trim(),
      });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setInput("");
      }
    } catch {
      toast.error("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  const otherMessagesCount = messages.filter((m) => {
    const senderIdStr = typeof m.sender_id === "object" ? m.sender_id?._id : m.sender_id;
    return senderIdStr !== currentUserId;
  }).length;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-lg border dark:border-white/[0.06] overflow-hidden bg-card dark:bg-card/50">
      <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-white/[0.06] bg-card">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <MessageCircle size={18} className="text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-medium truncate">Super Admin Communication</h2>
          <p className="text-[11px] text-muted-foreground">
            {messages.length > 0 ? `${otherMessagesCount} messages from super admin` : "No messages"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <MessageCircle size={32} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
            <p className="text-xs text-muted-foreground/60">Super admin messages from your organization will appear here</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderIdStr = typeof msg.sender_id === "object" ? msg.sender_id?._id : msg.sender_id;
            const senderName = typeof msg.sender_id === "object" ? msg.sender_id?.name || "User" : "User";
            const isMine = senderIdStr === currentUserId;
            const isSeen = msg.status === "seen";
            return (
              <div key={msg._id || `${msg.created_at || ""}-${idx}`} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-xl px-4 py-2.5",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted dark:bg-white/[0.06] rounded-bl-sm"
                  )}
                >
                  {!isMine && (
                    <p className="text-[11px] font-medium mb-0.5 opacity-70">{senderName}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                  <div className={cn("flex items-center gap-1 mt-1", isMine ? "justify-end" : "justify-start")}>
                    <span className={cn("text-[10px]", isMine ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMine && (
                      isSeen ? (
                        <CheckCheck size={12} className="text-blue-400" />
                      ) : (
                        <Check size={12} className="text-primary-foreground/60" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex items-end gap-2 p-4 border-t dark:border-white/[0.06]">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none dark:border-white/[0.06]"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0 transition-colors"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
