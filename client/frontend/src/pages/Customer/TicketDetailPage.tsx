import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { TicketAPI } from "@/api";
import { useToast } from "@/components/ui/toast";

interface TicketMessage {
  _id: string;
  sender_id: { _id: string; name: string; email: string; role?: string };
  content: string;
  is_internal: boolean;
  created_at: string;
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      TicketAPI.getById(id).catch(() => ({ data: { success: false, data: null } })),
      TicketAPI.getMessages(id).catch(() => ({ data: { success: false, data: [] } })),
    ]).then(([ticketRes, messagesRes]) => {
      const ticketData = ticketRes?.data?.data || ticketRes?.data;
      if (ticketData) setTicket(ticketData);
      
      const rawMessages = messagesRes?.data?.data || messagesRes?.data;
      if (Array.isArray(rawMessages)) {
        setMessages(rawMessages);
      } else if (rawMessages && Array.isArray(rawMessages.items)) {
        setMessages(rawMessages.items);
      } else if (rawMessages && Array.isArray(rawMessages.messages)) {
        setMessages(rawMessages.messages);
      } else {
        setMessages([]);
      }
    }).finally(() => setLoading(false));

    const interval = setInterval(() => {
      TicketAPI.getMessages(id)
        .then((res) => {
          const raw = res?.data?.data || res?.data;
          const msgList = Array.isArray(raw)
            ? raw
            : Array.isArray(raw?.items)
            ? raw.items
            : Array.isArray(raw?.messages)
            ? raw.messages
            : [];
          if (Array.isArray(msgList) && msgList.length > 0) {
            setMessages(msgList);
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !id) return;
    setSending(true);
    try {
      const res = await TicketAPI.sendMessage(id, { content: newMessage, is_internal: false });
      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setTicket((prev: any) => prev ? { ...prev, status: "in_progress" } : prev);
        setNewMessage("");
      }
    } catch {
      toast.error("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleClose = async () => {
    if (!id) return;
    try {
      const res = await TicketAPI.close(id);
      if (res.data?.success) {
        setTicket(res.data.data);
        toast.success("Ticket Closed", "Ticket confirmed and closed successfully");
      }
    } catch {
      toast.error("Error", "Failed to close ticket");
    }
  };

  const handleReopen = async () => {
    if (!id) return;
    try {
      const res = await TicketAPI.reopen(id);
      if (res.data?.success) {
        setTicket(res.data.data);
        toast.success("Ticket Reopened", "Ticket has been reopened for support assistance");
      }
    } catch {
      toast.error("Error", "Failed to reopen ticket");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-400">
        <Loader2 size={24} className="animate-spin text-indigo-500 mr-2" /> Loading Ticket...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 max-w-md mx-auto my-12 text-slate-200">
        <p className="font-semibold text-base">Ticket Not Found</p>
        <button onClick={() => navigate("/tickets")} className="text-indigo-400 text-xs mt-2 hover:underline">
          Return to My Tickets
        </button>
      </div>
    );
  }

  const userId = user?._id || user?.userId;
  const publicMessages = (Array.isArray(messages) ? messages : []).filter((m) => !m?.is_internal);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "in_progress": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "waiting_for_customer": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "resolved": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "closed": return "bg-slate-800 text-slate-400 border-slate-700";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] min-h-0 overflow-hidden space-y-3.5 max-w-5xl mx-auto text-slate-200">
      {/* Header Bar */}
      <div className="flex-shrink-0 flex items-center justify-between gap-4 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/tickets")} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            <ArrowLeft size={14} /> Back to My Tickets
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div>
            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 mr-2">
              #TK-{ticket.ticket_number || ticket._id?.slice(-4)}
            </span>
            <h1 className="text-base font-bold text-slate-100 inline">{ticket.subject || ticket.title}</h1>
          </div>
        </div>

        <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(ticket.status)}`}>
          {ticket.status?.replace(/_/g, " ")}
        </span>
      </div>

      {/* Ticket Information Card */}
      <div className="flex-shrink-0 bg-slate-900/60 backdrop-blur border border-slate-800 p-4 rounded-2xl space-y-2">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Information</h2>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs pt-0.5">
          <div>
            <span className="text-slate-400 text-[11px] block">Created By</span>
            <span className="font-semibold text-slate-200">{ticket.user_id?.name || user?.name || "Customer"}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Created Date & Time</span>
            <span className="font-medium text-slate-300">
              {new Date(ticket.createdAt || ticket.created_at).toLocaleDateString()} {new Date(ticket.createdAt || ticket.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Priority</span>
            <span className="font-semibold text-amber-300 uppercase">{ticket.priority || "Normal"}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Category</span>
            <span className="font-semibold text-slate-200">{ticket.category || "General"}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[11px] block">Assigned Support</span>
            <span className="font-semibold text-emerald-400">{ticket.assigned_to?.name || "Unassigned"}</span>
          </div>
        </div>

        {ticket.description && (
          <div className="mt-2 pt-2 border-t border-slate-800">
            <span className="text-slate-400 text-[11px] block mb-1">Initial Description</span>
            <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
              {ticket.description}
            </p>
          </div>
        )}
      </div>

      {/* Resolution Confirmation Banner */}
      {ticket.status === "resolved" && (
        <div className="flex-shrink-0 bg-purple-950/40 border border-purple-500/30 p-3 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
          <div>
            <span className="font-bold text-purple-200 block text-sm">Your issue has been marked as resolved.</span>
            <span className="text-purple-300/80">Please confirm if your issue is resolved to close this ticket, or reopen if you need further support.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-1.5"
            >
              <CheckCircle2 size={14} /> Confirm & Close
            </button>
            <button
              onClick={handleReopen}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5"
            >
              <RotateCcw size={14} /> Reopen Ticket
            </button>
          </div>
        </div>
      )}

      {/* Public Conversation Feed (THE ONLY SCROLLABLE AREA) */}
      <div className="flex-1 min-h-0 min-w-0 bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden">
        <div className="flex-shrink-0 p-3.5 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Public Conversation</h3>
          <span className="text-[11px] text-slate-400">{publicMessages.length} Messages</span>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {publicMessages.length === 0 ? (
            <div className="text-center py-16 text-slate-500 text-xs">No conversation messages yet.</div>
          ) : (
            publicMessages.map((msg, idx) => {
              const senderObjId = typeof msg.sender_id === "object" ? msg.sender_id?._id : msg.sender_id;
              const isMine = senderObjId === userId;
              const senderName = typeof msg.sender_id === "object" && msg.sender_id?.name
                ? msg.sender_id.name
                : isMine
                  ? "You"
                  : (msg as any).sender_type === "CUSTOMER"
                    ? (ticket?.user_id?.name || "Customer")
                    : (ticket?.assigned_to?.name || "Support Agent");

              return (
                <div key={msg._id || idx} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                  <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-200">{senderName}</span>
                    <span>• {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>

                  <div className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                    isMine
                      ? "bg-indigo-600 text-white rounded-br-none shadow-md"
                      : "bg-slate-800/80 border border-slate-700 text-slate-200 rounded-bl-none"
                  }`}>
                    {msg.content}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input Box */}
        {ticket.status !== "closed" ? (
          <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-950/60">
            <div className="flex gap-2">
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Type your message..."
                rows={2}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
              />
              <button
                onClick={handleSend}
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center justify-center gap-1.5"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Send
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-950/60 text-center text-xs text-slate-400">
            This ticket is closed. You can reopen it if you require additional support.
          </div>
        )}
      </div>
    </div>
  );
}