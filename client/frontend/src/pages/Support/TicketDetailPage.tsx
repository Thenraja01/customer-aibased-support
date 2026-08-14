import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Trash2, Loader2, Clock, CheckCircle2, RotateCcw, MessageSquare, UserPlus, EyeOff } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { TicketAPI } from "@/api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TicketTimeline } from "@/components/ticket/TicketTimeline";
import { cn } from "@/lib/utils";

interface TicketMessage {
  _id: string;
  sender_id: { _id: string; name: string; email: string };
  content: string;
  is_internal: boolean;
  created_at: string;
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [internalNote, setInternalNote] = useState(false);
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      TicketAPI.getById(id).catch(() => ({ data: { success: false, data: null } })),
      TicketAPI.getMessages(id).catch(() => ({ data: { success: false, data: [] } })),
    ]).then(([ticketRes, messagesRes]) => {
      if (ticketRes.data.success) setTicket(ticketRes.data.data);
      if (messagesRes.data.success) setMessages(messagesRes.data.data || []);
    }).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !id) return;
    setSending(true);
    try {
      const res = await TicketAPI.sendMessage(id, { content: newMessage, is_internal: internalNote });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessage("");
      }
    } catch {
      toast.error("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!id) return;
    setConfirmAction(() => async () => {
      try {
        await TicketAPI.deleteMessage(id, messageId);
        setMessages((prev) => prev.filter((m) => m._id !== messageId));
      } catch {
        toast.error("Error", "Failed to delete message");
      }
    });
    setConfirmOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={20} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground text-sm">Ticket not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-xs mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  const roleName = user?.role || user?.roleName || (typeof user?.role_id === "object" ? user.role_id?.role_name : user?.role_id);
  const isSupport = roleName === "support";
  const userId = user?._id;

  const updateStatus = async (status: string) => {
    try {
      let res;
      if (status === "resolved") res = await TicketAPI.resolve(ticket._id);
      else if (status === "closed") res = await TicketAPI.close(ticket._id);
      else if (status === "in_progress") res = await TicketAPI.setInProgress(ticket._id);
      else if (status === "pending") res = await TicketAPI.setPending(ticket._id);
      else if (status === "open") res = await TicketAPI.reopen(ticket._id);
      if (res?.data.success) setTicket(res.data.data);
    } catch {
      toast.error("Error", "Failed to update status");
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "open": return "badge-open";
      case "in_progress": return "badge-in-progress";
      case "resolved": return "badge-resolved";
      case "closed": return "badge-closed";
      default: return "badge-closed";
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0 mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{ticket.subject}</h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs text-muted-foreground">#{ticket._id?.slice(-6)}</span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">{ticket.category}</span>
            {ticket.priority && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-md",
                  ticket.priority === "urgent" || ticket.priority === "high" ? "badge-urgent" : "bg-muted text-muted-foreground"
                )}>
                  {ticket.priority}
                </span>
              </>
            )}
            <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md", getStatusStyle(ticket.status))}>
              {ticket.status?.replace("_", " ")}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          {isSupport && !ticket.assigned_to && ticket.status !== "resolved" && ticket.status !== "closed" && (
            <button
              onClick={async () => {
                try {
                  const res = await TicketAPI.assign(ticket._id, { supportId: userId });
                  if (res.data.success) setTicket(res.data.data);
                  else toast.error("Error", "Failed to assign ticket");
                } catch {
                  toast.error("Error", "Failed to assign ticket");
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary/10 text-primary hover:bg-primary/15 transition-colors"
            >
              <UserPlus size={13} /> Assign to Me
            </button>
          )}
          {isSupport && ticket.status !== "resolved" && ticket.status !== "closed" && (
            <>
              {ticket.status !== "in_progress" && (
                <button onClick={() => updateStatus("in_progress")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-500/15 transition-colors">
                  <Clock size={13} /> In Progress
                </button>
              )}
              <button onClick={() => updateStatus("resolved")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                <CheckCircle2 size={13} /> Resolve
              </button>
            </>
          )}
          {isSupport && (ticket.status === "resolved" || ticket.status === "closed") && (
            <button onClick={() => updateStatus("open")} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors">
              <RotateCcw size={13} /> Reopen
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {ticket.description && (
        <div className="rounded-lg border border-border bg-card p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1.5 font-medium uppercase ">Description</p>
          <p className="text-sm whitespace-pre-wrap leading-relaxed">{ticket.description}</p>
          {ticket.user_id?.name && (
            <p className="text-xs text-muted-foreground mt-3">by {ticket.user_id.name} · {new Date(ticket.created_at).toLocaleString()}</p>
          )}
        </div>
      )}

      {/* Escalation preview */}
      {ticket.escalated_from_chat?.conversation_preview && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/[0.04] p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={13} className="text-amber-500" />
            <p className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase ">Escalated from AI Chat</p>
          </div>
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed font-sans">{ticket.escalated_from_chat.conversation_preview}</pre>
        </div>
      )}

      {/* Timeline */}
      <div className="rounded-lg border border-border bg-card px-4 py-2 mb-4">
        <TicketTimeline ticket={ticket} messages={messages} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare size={24} className="mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No messages yet</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMine = msg.sender_id?._id === userId;
            const isInternal = msg.is_internal;
            return (
              <div key={msg._id || `${msg.created_at || ""}-${idx}`} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={cn(
                  "max-w-[75%] rounded-2xl px-4 py-3",
                  isInternal
                    ? "bg-amber-500/[0.06] border border-amber-500/20 rounded-br-md"
                    : isMine
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md"
                )}>
                  {!isMine && (
                    <p className="text-[11px] font-medium mb-1 text-muted-foreground">{msg.sender_id?.name || "Unknown"}</p>
                  )}
                  {isInternal && (
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <EyeOff size={11} className="text-amber-500" />
                      <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase ">Internal Note</p>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap leading-relaxed break-words">{msg.content}</p>
                  <div className="flex items-center justify-between mt-1.5 gap-3">
                    <p className={cn("text-[10px]", isMine && !isInternal ? "text-primary-foreground/60" : "text-muted-foreground/50")}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                    {isMine && (
                      <button onClick={() => handleDeleteMessage(msg._id)} title="Delete message" className={cn("p-0.5 rounded hover:bg-black/10 transition-colors", isMine && !isInternal ? "text-primary-foreground/60 hover:text-primary-foreground" : "text-muted-foreground/50 hover:text-foreground")}>
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Compose */}
      {ticket.status !== "closed" && (
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-3 mb-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer select-none">
              <input
                type="checkbox"
                checked={internalNote}
                onChange={(e) => setInternalNote(e.target.checked)}
                className="rounded border-border"
              />
              <EyeOff size={12} />
              Internal note
            </label>
          </div>
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder={internalNote ? "Write an internal note..." : "Type a message..."}
              rows={2}
              className="flex-1 rounded-xl border border-border bg-card px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="self-end p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-colors"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}
