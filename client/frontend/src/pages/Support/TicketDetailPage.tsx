import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Trash2, Loader2, Clock, CheckCircle2, RotateCcw, MessageSquare } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { TicketAPI } from "@/api";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

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
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Ticket not found</p>
        <button onClick={() => navigate(-1)} className="text-primary text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  const roleName = typeof user?.role_id === "object" ? user.role_id?.role_name : user?.role_id;
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

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/support/tickets")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{ticket.subject}</h1>
          <p className="text-xs text-muted-foreground">
            #{ticket._id?.slice(-6)} &middot; {ticket.category} &middot; {ticket.priority}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isSupport && ticket.status !== "resolved" && ticket.status !== "closed" && (
            <>
              {ticket.status !== "in_progress" && (
                <button onClick={() => updateStatus("in_progress")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-500/20">
                  <Clock size={14} /> In Progress
                </button>
              )}
              <button onClick={() => updateStatus("pending")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80">
                <Clock size={14} /> Pending
              </button>
              <button onClick={() => updateStatus("resolved")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90">
                <CheckCircle2 size={14} /> Resolve
              </button>
            </>
          )}
          {isSupport && (ticket.status === "resolved" || ticket.status === "closed") && (
            <button onClick={() => updateStatus("open")} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80">
              <RotateCcw size={14} /> Reopen
            </button>
          )}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${
            ticket.status === "open" ? "bg-primary/10 text-primary" :
            ticket.status === "in_progress" ? "bg-accent text-accent-foreground" :
            ticket.status === "resolved" ? "bg-primary/10 text-primary" :
            ticket.status === "closed" ? "bg-muted text-muted-foreground" :
            "bg-muted text-muted-foreground"
          }`}>
            {ticket.status?.replace("_", " ")}
          </span>
        </div>
      </div>

      {ticket.description && (
        <div className="rounded-xl border bg-card p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Description</p>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          {ticket.user_id?.name && (
            <p className="text-xs text-muted-foreground mt-2">by {ticket.user_id.name} &middot; {new Date(ticket.created_at).toLocaleString()}</p>
          )}
        </div>
      )}

      {ticket.escalated_from_chat?.conversation_preview && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={14} className="text-amber-500" />
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Escalated from AI Chat</p>
          </div>
          <pre className="text-xs whitespace-pre-wrap text-muted-foreground leading-relaxed font-sans">{ticket.escalated_from_chat.conversation_preview}</pre>
        </div>
      )}




      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No messages yet</div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id?._id === userId;
            const isInternal = msg.is_internal;
            return (
              <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                  isInternal ? "bg-amber-500/10 border border-amber-500/20" :
                  isMine ? "bg-primary text-primary-foreground" : "bg-card border"
                }`}>
                  {!isMine && (
                    <p className="text-[11px] font-medium mb-1 opacity-70">{msg.sender_id?.name || "Unknown"}</p>
                  )}
                  {isInternal && (
                    <p className="text-[10px] font-semibold text-amber-500 mb-1 uppercase tracking-wider">Internal Note</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <p className={`text-[10px] ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                      {new Date(msg.created_at).toLocaleString()}
                    </p>
                    {isMine && (
                      <button onClick={() => handleDeleteMessage(msg._id)} className={`p-0.5 rounded hover:bg-black/10 ${isMine ? "text-primary-foreground/70 hover:text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                        <Trash2 size={12} />
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

      {ticket.status !== "closed" && (
        <div className="border-t pt-4">
          <div className="flex items-center gap-2 mb-2">
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={internalNote}
                onChange={(e) => setInternalNote(e.target.checked)}
                className="rounded"
              />
              Internal note
            </label>
          </div>
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type a message..."
              rows={2}
              className="flex-1 rounded-xl border bg-background px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <button
              onClick={handleSend}
              disabled={sending || !newMessage.trim()}
              className="self-end p-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
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
