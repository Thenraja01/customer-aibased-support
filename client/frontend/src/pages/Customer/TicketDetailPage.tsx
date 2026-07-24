import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, AlertCircle, CheckCircle2, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TicketAPI } from "@/api";

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
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      const res = await TicketAPI.sendMessage(id, { content: newMessage, is_internal: false });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setTicket((prev: any) => prev ? { ...prev, status: "in_progress" } : prev);
        setNewMessage("");
      }
    } catch {
      setError("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      const res = await TicketAPI.close(id);
      if (res.data.success) setTicket(res.data.data);
    } catch {
      setError("Failed to close ticket");
    }
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
        <button onClick={() => navigate("/tickets")} className="text-primary text-sm mt-2 hover:underline">Go back</button>
      </div>
    );
  }

  const userId = user?._id;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-primary/10 text-primary";
      case "assigned": return "bg-accent text-accent-foreground";
      case "in_progress": return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "waiting_for_customer": return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "resolved": return "bg-green-500/10 text-green-600";
      case "closed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate("/tickets")} className="p-2 rounded-lg hover:bg-muted transition-colors">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{ticket.subject}</h1>
          <p className="text-xs text-muted-foreground">
            #{ticket._id?.slice(-6)} &middot; {ticket.category} &middot; {ticket.priority}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {ticket.status !== "closed" && ticket.status !== "resolved" && (
            <button onClick={handleClose} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80">
              <CheckCircle2 size={14} /> Close
            </button>
          )}
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${getStatusColor(ticket.status)}`}>
            {ticket.status?.replace(/_/g, " ")}
          </span>
        </div>
      </div>

      {ticket.description && (
        <div className="rounded-xl border bg-card p-4 mb-4">
          <p className="text-xs text-muted-foreground mb-1">Description</p>
          <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
          {ticket.assigned_to?.name && (
            <p className="text-xs text-muted-foreground mt-2">Assigned to {ticket.assigned_to.name}</p>
          )}
          <p className="text-xs text-muted-foreground mt-1">{new Date(ticket.created_at).toLocaleString()}</p>
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

      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive flex items-center gap-2 mb-4">
          <AlertCircle size={14} />{error}
          <button onClick={() => setError("")} className="ml-auto"><span className="text-xs">&times;</span></button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 mb-4">
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">No messages yet</div>
        ) : (
          messages.filter((m) => !m.is_internal).map((msg) => {
            const isMine = msg.sender_id?._id === userId;
            return (
              <div key={msg._id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] rounded-xl px-4 py-3 ${
                  isMine ? "bg-primary text-primary-foreground" : "bg-card border"
                }`}>
                  {!isMine && (
                    <p className="text-[11px] font-medium mb-1 opacity-70">{msg.sender_id?.name || "Support"}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className={`text-[10px] mt-1.5 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {ticket.status !== "closed" && ticket.status !== "resolved" ? (
        <div className="border-t pt-4">
          <div className="flex gap-2">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="Type your reply..."
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
      ) : (
        <div className="border-t pt-4 text-center text-xs text-muted-foreground py-2">
          This ticket is {ticket.status}. You cannot send messages unless it is reopened.
        </div>
      )}
    </div>
  );
}