import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { 
  ArrowLeft, Send, Loader2, Clock, CheckCircle2, 
  MessageSquare, UserPlus, EyeOff, ShieldAlert, AlertTriangle, 
  User, Shield, X, Check,
  ArrowRightLeft, UserCheck, Sparkles, BookOpen
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { TicketAPI, FAQAPI } from "@/api";
import AxiosInstance from "@/api/axiosInstance";
import TicketAiIntelligencePanel from "@/components/ticket/TicketAiIntelligencePanel";
import { useToast } from "@/components/ui/toast";

interface TicketMessage {
  _id: string;
  sender_id: { _id: string; name: string; email: string; role?: string };
  content: string;
  is_internal: boolean;
  created_at: string;
}

export default function TicketDetailPage() {
  const { id: paramId } = useParams();
  const location = useLocation();
  const id = paramId || location.pathname.split("/").filter(Boolean).pop();
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const toast = useToast();

  const [ticket, setTicket] = useState<any>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [activeTab, setActiveTab] = useState<"public" | "internal">("public");
  const [internalNote, setInternalNote] = useState(false);

  // Modals state
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showTakeoverModal, setShowTakeoverModal] = useState(false);
  const [showProposeFaqModal, setShowProposeFaqModal] = useState(false);

  // FAQ Proposal Form States
  const [faqQuestion, setFaqQuestion] = useState("");
  const [faqAnswer, setFaqAnswer] = useState("");
  const [faqCategory, setFaqCategory] = useState("Technical");
  const [submittingFaq, setSubmittingFaq] = useState(false);

  // Action input states
  const [escalateReason, setEscalateReason] = useState("Unable to Resolve");
  const [escalateComment, setEscalateComment] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [reassignNote, setReassignNote] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);

  // Available support agents for reassignment
  const [availableAgents, setAvailableAgents] = useState<any[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    fetchTicketData();

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

  const fetchTicketData = async () => {
    setLoading(true);
    try {
      const [ticketRes, messagesRes] = await Promise.all([
        TicketAPI.getById(id!),
        TicketAPI.getMessages(id!),
      ]);
      const ticketData = ticketRes.data?.data || ticketRes.data;
      if (ticketData) setTicket(ticketData);
      
      const msgData = messagesRes.data?.data || messagesRes.data;
      if (Array.isArray(msgData)) setMessages(msgData);
      else if (msgData?.items && Array.isArray(msgData.items)) setMessages(msgData.items);
      else if (msgData?.messages && Array.isArray(msgData.messages)) setMessages(msgData.messages);
      else setMessages([]);
    } catch (err) {
      console.error("Failed to load ticket details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchAgentsForReassign = async () => {
    setLoadingAgents(true);
    try {
      const res = await AxiosInstance.get("/tickets/workload");
      if (res.data?.data) {
        setAvailableAgents(Array.isArray(res.data.data) ? res.data.data : []);
      } else {
        setAvailableAgents([]);
      }
    } catch {
      setAvailableAgents([]);
    } finally {
      setLoadingAgents(false);
    }
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !id) return;
    setSending(true);
    try {
      const isInternalMsg = internalNote || activeTab === "internal";
      const res = await TicketAPI.sendMessage(id, { content: newMessage, is_internal: isInternalMsg });
      if (res.data?.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setNewMessage("");
      }
    } catch {
      toast.error("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const updateStatus = async (status: string) => {
    try {
      let res;
      if (status === "resolved") res = await TicketAPI.resolve(ticket._id);
      else if (status === "closed") res = await TicketAPI.close(ticket._id);
      else if (status === "in_progress") res = await TicketAPI.setInProgress(ticket._id);
      else if (status === "pending" || status === "waiting_for_customer") res = await TicketAPI.setPending(ticket._id);
      else if (status === "open") res = await TicketAPI.reopen(ticket._id);
      
      if (res?.data?.success) {
        setTicket(res.data.data);
        toast.success("Status Updated", `Ticket is now ${status.replace("_", " ").toUpperCase()}`);
      }
    } catch {
      toast.error("Error", "Failed to update ticket status");
    }
  };

  const handleEscalateSubmit = async () => {
    if (!id) return;
    setSubmittingAction(true);
    try {
      await AxiosInstance.patch(`/tickets/${id}/escalate`, {
        reason: escalateReason,
        target: "branch_admin",
      });

      if (escalateComment.trim()) {
        await TicketAPI.sendMessage(id, {
          content: `[Escalated to Branch Admin] Reason: ${escalateReason}. Comment: ${escalateComment}`,
          is_internal: true,
        });
      }

      setTicket((prev: any) => ({ ...prev, status: "escalated" }));
      setShowEscalateModal(false);
      fetchTicketData();
      toast.success("Ticket Escalated", "Ticket escalated to Branch Administrator");
    } catch {
      toast.error("Error", "Failed to escalate ticket");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReassignSubmit = async () => {
    if (!id || !selectedAgentId) return;
    setSubmittingAction(true);
    try {
      const res = await TicketAPI.assign(id, { supportId: selectedAgentId });
      if (reassignNote.trim()) {
        await TicketAPI.sendMessage(id, {
          content: `[Reassigned Support Agent] ${reassignNote}`,
          is_internal: true,
        });
      }
      if (res.data?.success) {
        setTicket(res.data.data);
      }
      setShowReassignModal(false);
      fetchTicketData();
      toast.success("Support Reassigned", "Ticket assigned to new support agent");
    } catch {
      toast.error("Error", "Failed to reassign support agent");
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleTakeoverSubmit = async () => {
    if (!id) return;
    setSubmittingAction(true);
    try {
      await AxiosInstance.patch(`/tickets/${id}/takeover`, { note: "Branch Admin Takeover" });
      setShowTakeoverModal(false);
      fetchTicketData();
      toast.success("Takeover Complete", "You have taken ownership of this ticket");
    } catch {
      toast.error("Error", "Failed to take over ticket");
    } finally {
      setSubmittingAction(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-slate-400">
        <Loader2 size={24} className="animate-spin text-indigo-500 mr-2" /> Loading Ticket Workspace...
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-20 bg-slate-900/60 border border-slate-800 rounded-2xl p-8 max-w-md mx-auto my-12">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-slate-200 font-semibold text-base">Ticket Not Found</p>
        <p className="text-slate-400 text-xs mt-1 mb-4">The ticket requested may have been removed or moved to another branch.</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl transition">
          Return to Queue
        </button>
      </div>
    );
  }

  const roleName = (user?.role || user?.roleName || "").toLowerCase();
  const isBranchAdmin = roleName === "branch_admin" || roleName === "admin" || roleName === "super_admin";
  const isStaff = ["support", "branch_admin", "admin", "super_admin"].includes(roleName);

  const publicMessages = messages.filter((m) => !m.is_internal);
  const internalMessages = messages.filter((m) => m.is_internal);
  const displayedMessages = activeTab === "public" ? publicMessages : internalMessages;

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "urgent":
      case "p1": return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "high":
      case "p2": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "medium":
      case "p3": return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new": return "bg-sky-500/20 text-sky-300 border-sky-500/30";
      case "open": return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
      case "assigned": return "bg-indigo-500/20 text-indigo-300 border-indigo-500/30";
      case "in_progress": return "bg-blue-500/20 text-blue-300 border-blue-500/30";
      case "waiting_for_customer": return "bg-amber-500/20 text-amber-300 border-amber-500/30";
      case "escalated": return "bg-rose-500/20 text-rose-300 border-rose-500/30";
      case "resolved": return "bg-purple-500/20 text-purple-300 border-purple-500/30";
      case "closed": return "bg-slate-800 text-slate-400 border-slate-700";
      default: return "bg-slate-800 text-slate-400 border-slate-700";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)] min-h-0 overflow-hidden space-y-3.5 max-w-[1600px] mx-auto text-slate-200">
      {/* Header Bar */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/80 backdrop-blur p-4 rounded-2xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
          >
            <ArrowLeft size={14} /> Back to Tickets
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
              #TK-{ticket.ticket_number || ticket._id?.slice(-4)}
            </span>
            <h1 className="text-base font-bold text-slate-100 truncate max-w-md">{ticket.subject || ticket.title || "Ticket Details"}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getStatusBadge(ticket.status)}`}>
            {ticket.status?.replace(/_/g, " ")}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${getPriorityBadge(ticket.priority)}`}>
            {ticket.priority?.toUpperCase() || "NORMAL"} SLA
          </span>
        </div>
      </div>

      {/* Top Metadata Bar */}
      <div className="flex-shrink-0 grid grid-cols-2 md:grid-cols-6 gap-3 bg-slate-900/60 backdrop-blur border border-slate-800 p-3.5 rounded-2xl text-xs">
        <div>
          <span className="text-slate-400 text-[11px] block">Created By</span>
          <span className="font-semibold text-slate-200">{ticket.user_id?.name || ticket.user_id?.email || "Customer"}</span>
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
          <span className="text-slate-400 text-[11px] block">Currently Assigned</span>
          <span className="font-semibold text-emerald-400">{ticket.assigned_to?.name || "Unassigned"}</span>
        </div>
        <div>
          <span className="text-slate-400 text-[11px] block">Branch</span>
          <span className="font-semibold text-indigo-300">{ticket.branch_id?.name || ticket.organization_id?.name || "Main Office"}</span>
        </div>
      </div>

      {/* 3-Column Enterprise Workspace */}
      <div className="flex-1 min-h-0 min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        
        {/* LEFT COLUMN: ASSIGNEE, TICKET DETAILS, ACTIONS & PROGRESS HISTORY */}
        <div className="lg:col-span-3 h-full min-h-0 min-w-0 overflow-y-auto pr-1 space-y-4">
          
          {/* ASSIGNEE CARD */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Assignee</h2>
            <div className="flex items-center gap-3 bg-slate-950/60 p-3 rounded-xl border border-slate-800">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-300 font-bold flex items-center justify-center border border-indigo-500/30 text-sm">
                {ticket.assigned_to?.name?.[0] || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-slate-100 text-xs truncate">{ticket.assigned_to?.name || "Unassigned"}</div>
                <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online
                </div>
              </div>
            </div>

            {/* Branch Admin Action Button for Reassignment */}
            {isBranchAdmin && (
              <button
                onClick={() => {
                  fetchAgentsForReassign();
                  setShowReassignModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-semibold transition"
              >
                <ArrowRightLeft className="w-4 h-4" /> Reassign Support Agent
              </button>
            )}
          </div>

          {/* TICKET DETAILS CARD */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Ticket Details</h2>
            
            <div className="space-y-2.5 text-xs divide-y divide-slate-800/60">
              <div className="flex justify-between pt-1">
                <span className="text-slate-400">Customer:</span>
                <span className="font-semibold text-slate-200">{ticket.user_id?.name || "Customer"}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Email:</span>
                <span className="font-medium text-slate-300">{ticket.user_id?.email || "N/A"}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Branch:</span>
                <span className="font-semibold text-indigo-300">{ticket.branch_id?.name || ticket.organization_id?.name || "Main Office"}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Status:</span>
                <span className="font-semibold text-blue-400 uppercase">{ticket.status}</span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">SLA Status:</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {ticket.sla_status ? ticket.sla_status.replace("_", " ").toUpperCase() : "ON TRACK"}
                </span>
              </div>
              <div className="flex justify-between pt-2">
                <span className="text-slate-400">Ticket ID:</span>
                <span className="font-mono text-slate-300">TK-{ticket.ticket_number || ticket._id?.slice(-4)}</span>
              </div>
            </div>
          </div>

          {/* ACTIONS CARD */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-3">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Actions</h2>

            <div className="space-y-2">
              {/* Support Agent Actions */}
              {isStaff && ticket.status !== "resolved" && ticket.status !== "closed" && (
                <>
                  {ticket.status !== "in_progress" && (
                    <button
                      onClick={() => updateStatus("in_progress")}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold transition"
                    >
                      <Clock className="w-4 h-4" /> Mark In Progress
                    </button>
                  )}

                  {ticket.status !== "waiting_for_customer" && (
                    <button
                      onClick={() => updateStatus("waiting_for_customer")}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition"
                    >
                      <User className="w-4 h-4" /> Waiting for Customer
                    </button>
                  )}

                  {/* Escalate to Branch Admin */}
                  {ticket.status !== "escalated" && (
                    <button
                      onClick={() => setShowEscalateModal(true)}
                      className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-semibold transition"
                    >
                      <ShieldAlert className="w-4 h-4" /> Escalate to Branch Admin
                    </button>
                  )}
                </>
              )}

              {/* Branch Admin Specific Actions */}
              {isBranchAdmin && ticket.status === "escalated" && (
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => {
                      fetchAgentsForReassign();
                      setShowReassignModal(true);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-lg transition"
                  >
                    <UserPlus className="w-4 h-4" /> Assign to Another Support
                  </button>

                  <button
                    onClick={() => setShowTakeoverModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-400/30 rounded-xl text-xs font-semibold transition"
                  >
                    <Shield className="w-4 h-4" /> Take Over Ticket
                  </button>
                </div>
              )}

              {/* Resolution Actions */}
              {isStaff && ticket.status !== "resolved" && ticket.status !== "closed" && (
                <button
                  onClick={() => updateStatus("resolved")}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg transition"
                >
                  <CheckCircle2 className="w-4 h-4" /> Mark Resolved
                </button>
              )}

              {isStaff && ticket.status === "resolved" && (
                <button
                  onClick={() => updateStatus("closed")}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition"
                >
                  <Check className="w-4 h-4" /> Close Ticket
                </button>
              )}

              {/* Front-Line Knowledge Base Contribution */}
              {isStaff && (
                <button
                  onClick={() => {
                    setFaqQuestion(ticket.subject || "");
                    const lastAgentMsg = [...messages].reverse().find(m => !m.is_internal && m.sender_id?._id !== ticket.user_id?._id);
                    setFaqAnswer(lastAgentMsg?.content || ticket.description || "");
                    setShowProposeFaqModal(true);
                  }}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-semibold transition"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" /> Propose as FAQ
                </button>
              )}
            </div>
          </div>

          {/* PROGRESS HISTORY (Vertical Timeline) */}
          <div className="bg-slate-900/60 backdrop-blur border border-slate-800 p-5 rounded-2xl space-y-4">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
              <span>Progress History</span>
              <span className="text-[10px] text-slate-500 font-normal">Audit Log</span>
            </h2>

            {/* Support Switch Information */}
            {ticket.previously_assigned_to && (
              <div className="bg-indigo-950/40 border border-indigo-500/20 p-3 rounded-xl space-y-1 text-xs">
                <div className="text-[11px] text-slate-400">Previously Assigned:</div>
                <div className="font-medium text-slate-300 line-through">{ticket.previously_assigned_to?.name || "Previous Support"}</div>
                <div className="text-[11px] text-slate-400 mt-1">Currently Assigned:</div>
                <div className="font-semibold text-emerald-400 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5" /> {ticket.assigned_to?.name || "Current Agent"}
                </div>
              </div>
            )}

            {/* Vertical Timeline */}
            <div className="relative pl-4 space-y-4 border-l border-slate-800 text-xs">
              {/* Event 1: Ticket Created */}
              <div className="relative">
                <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-slate-900" />
                <div className="font-semibold text-slate-200">Ticket Created</div>
                <div className="text-[11px] text-slate-400">
                  {new Date(ticket.createdAt || ticket.created_at).toLocaleString()}
                </div>
              </div>

              {/* Event 2: Assigned */}
              {ticket.assigned_to && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-slate-900" />
                  <div className="font-semibold text-slate-200">Assigned to {ticket.assigned_to?.name}</div>
                  <div className="text-[11px] text-slate-400">Support Agent</div>
                </div>
              )}

              {/* Event 3: In Progress / Customer Replied */}
              {ticket.status !== "new" && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-indigo-500 ring-4 ring-slate-900" />
                  <div className="font-semibold text-slate-200">In Progress</div>
                  <div className="text-[11px] text-slate-400">Investigation active</div>
                </div>
              )}

              {/* Event 4: Escalation (if applicable) */}
              {ticket.status === "escalated" || ticket.escalation?.escalated_at ? (
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-4 ring-slate-900" />
                  <div className="font-semibold text-rose-300">Escalated to Branch Admin</div>
                  <div className="text-[11px] text-rose-400/80">
                    Reason: {ticket.escalation?.reason || "Unable to resolve"}
                  </div>
                </div>
              ) : null}

              {/* Reassignment History List */}
              {Array.isArray(ticket.reassignment_history) && ticket.reassignment_history.map((hist: any, hIdx: number) => (
                <div key={hIdx} className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-slate-900" />
                  <div className="font-semibold text-purple-300">Reassigned to {hist.to_user?.name || "Support"}</div>
                  <div className="text-[11px] text-slate-400">
                    {hist.note ? `"${hist.note}"` : "Reassignment recorded"}
                  </div>
                </div>
              ))}

              {/* Event 5: Resolution */}
              {ticket.status === "resolved" && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-slate-900" />
                  <div className="font-semibold text-purple-300">Marked Resolved</div>
                  <div className="text-[11px] text-slate-400">Pending customer confirmation</div>
                </div>
              )}

              {/* Event 6: Closed */}
              {ticket.status === "closed" && (
                <div className="relative">
                  <div className="absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full bg-slate-600 ring-4 ring-slate-900" />
                  <div className="font-semibold text-slate-400">Ticket Closed</div>
                  <div className="text-[11px] text-slate-500">Lifecycle completed</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: PUBLIC CONVERSATION & INTERNAL NOTES */}
        <div className="lg:col-span-6 h-full min-h-0 min-w-0 bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl flex flex-col shadow-xl overflow-hidden">
          {/* Thread Header Tabs */}
          <div className="flex-shrink-0 p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab("public")}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                  activeTab === "public"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" /> Public Conversation ({publicMessages.length})
              </button>

              {isStaff && (
                <button
                  onClick={() => setActiveTab("internal")}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 ${
                    activeTab === "internal"
                      ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <EyeOff className="w-3.5 h-3.5" /> Internal Notes ({internalMessages.length})
                </button>
              )}
            </div>
          </div>

          {/* Messages Feed (THE ONLY CENTER SCROLLABLE AREA) */}
          <div className="flex-1 min-h-0 min-w-0 p-4 overflow-y-auto space-y-4">
            {displayedMessages.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                {activeTab === "public" ? "No public messages recorded yet." : "No internal staff notes recorded yet."}
              </div>
            ) : (
              displayedMessages.map((msg, idx) => {
                const senderObjId = typeof msg.sender_id === "object" ? msg.sender_id?._id : msg.sender_id;
                const isMine = senderObjId === (user?._id || user?.userId);
                
                const senderName = typeof msg.sender_id === "object" && msg.sender_id?.name
                  ? msg.sender_id.name
                  : (msg as any).sender_type === "CUSTOMER"
                    ? (ticket?.user_id?.name || "Customer")
                    : (msg as any).sender_type === "BRANCH_ADMIN"
                      ? "Branch Admin"
                      : (ticket?.assigned_to?.name || "Support Agent");

                const senderRole = typeof msg.sender_id === "object" && msg.sender_id?.role
                  ? msg.sender_id.role.replace("_", " ").toUpperCase()
                  : ((msg as any).sender_type || "CUSTOMER").replace("_", " ").toUpperCase();

                return (
                  <div key={msg._id || idx} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                    <div className="flex items-center gap-2 mb-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-200">{senderName}</span>
                      {senderRole && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                          {senderRole}
                        </span>
                      )}
                      <span>• {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>

                    <div className={`p-4 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                      msg.is_internal
                        ? "bg-amber-500/10 border border-amber-500/30 text-amber-200 rounded-br-none"
                        : isMine
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

          {/* Message Composer */}
          {ticket.status !== "closed" && (
            <div className="flex-shrink-0 p-4 border-t border-slate-800 bg-slate-950/60 space-y-3">
              {isStaff && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="internalToggle"
                    checked={internalNote || activeTab === "internal"}
                    onChange={(e) => setInternalNote(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-900 text-amber-600 focus:ring-amber-500 h-4 w-4 cursor-pointer"
                  />
                  <label htmlFor="internalToggle" className="text-xs text-amber-300 font-medium cursor-pointer flex items-center gap-1.5">
                    <EyeOff className="w-3.5 h-3.5" /> Post as Internal Note (Invisible to Customer)
                  </label>
                </div>
              )}

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
                  placeholder={internalNote || activeTab === "internal" ? "Type internal note..." : "Type response to customer..."}
                  rows={2}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <button
                  onClick={handleSend}
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center justify-center"
                >
                  {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: AI INTELLIGENCE PANEL */}
        <div className="lg:col-span-3 h-full min-h-0 min-w-0 overflow-y-auto pr-1 space-y-4">
          
          {/* AI INTELLIGENCE PANEL */}
          {ticket?._id && (
            <TicketAiIntelligencePanel
              ticketId={ticket._id}
              messagesCount={messages.length}
              onUseResponse={(text) => {
                setNewMessage(text);
                if (ticket?.status === "closed" || ticket?.status === "resolved") {
                  updateStatus("open");
                }
              }}
              onEscalate={() => setShowEscalateModal(true)}
              onPriorityUpdated={() => fetchTicketData()}
            />
          )}
        </div>
      </div>

      {/* MODAL 1: ESCALATE TICKET */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" /> Escalate Ticket to Branch Admin
              </h3>
              <button onClick={() => setShowEscalateModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 font-medium block mb-1">Escalation Reason</label>
                <select
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                >
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Unable to Resolve">Unable to Resolve</option>
                  <option value="Customer Complaint">Customer Complaint</option>
                  <option value="SLA Risk">SLA Risk</option>
                  <option value="Requires Senior Support">Requires Senior Support</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-slate-300 font-medium block mb-1">Internal Comment</label>
                <textarea
                  value={escalateComment}
                  onChange={(e) => setEscalateComment(e.target.value)}
                  placeholder="Unable to resolve after basic troubleshooting..."
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowEscalateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleEscalateSubmit}
                disabled={submittingAction}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-2"
              >
                {submittingAction && <Loader2 size={14} className="animate-spin" />}
                Submit Escalation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: REASSIGN SUPPORT */}
      {showReassignModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-400" /> Select Support Agent
              </h3>
              <button onClick={() => setShowReassignModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <label className="text-slate-300 font-medium block">Available Support Agents & Workloads</label>
              
              {loadingAgents ? (
                <div className="py-8 text-center text-slate-400">Loading agents list...</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {availableAgents.map((agent) => (
                    <div
                      key={agent._id}
                      onClick={() => setSelectedAgentId(agent._id)}
                      className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                        selectedAgentId === agent._id
                          ? "bg-indigo-600/20 border-indigo-500 text-slate-100"
                          : "bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-semibold">{agent.name}</div>
                        <div className="text-[11px] text-slate-400">{agent.email}</div>
                      </div>
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
                        {agent.openTickets} Open Tickets
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-slate-300 font-medium block mb-1">Optional Internal Note</label>
                <textarea
                  value={reassignNote}
                  onChange={(e) => setReassignNote(e.target.value)}
                  placeholder="Please continue troubleshooting with customer..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReassignModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReassignSubmit}
                disabled={submittingAction || !selectedAgentId}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-2"
              >
                {submittingAction && <Loader2 size={14} className="animate-spin" />}
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: TAKEOVER CONFIRMATION */}
      {showTakeoverModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-purple-400" /> Take Ownership of Ticket
              </h3>
              <button onClick={() => setShowTakeoverModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>Are you sure you want to take over direct ownership of this ticket?</p>
              
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1">
                <div><span className="text-slate-400">Current Owner:</span> <span className="font-semibold text-slate-200">{ticket.assigned_to?.name || "Current Agent"}</span></div>
                <div><span className="text-slate-400">New Owner:</span> <span className="font-semibold text-purple-300">Branch Admin (You)</span></div>
              </div>

              <p className="text-[11px] text-slate-400">You will communicate directly with the customer using the same ongoing conversation thread.</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowTakeoverModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTakeoverSubmit}
                disabled={submittingAction}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-2"
              >
                {submittingAction && <Loader2 size={14} className="animate-spin" />}
                Take Over
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PROPOSE AS KNOWLEDGE BASE FAQ */}
      {showProposeFaqModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" /> Propose Knowledge Base FAQ
              </h3>
              <button onClick={() => setShowProposeFaqModal(false)} className="text-slate-400 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1 font-medium">Question / Customer Query</label>
                <input
                  type="text"
                  value={faqQuestion}
                  onChange={(e) => setFaqQuestion(e.target.value)}
                  placeholder="e.g. How do I initiate a return for my order?"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Category</label>
                <select
                  value={faqCategory}
                  onChange={(e) => setFaqCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-200 focus:outline-none"
                >
                  <option value="Technical">Technical</option>
                  <option value="Billing">Billing & Orders</option>
                  <option value="Policy">Policy & Returns</option>
                  <option value="Account">Account Management</option>
                  <option value="General">General</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1 font-medium">Verified Answer</label>
                <textarea
                  value={faqAnswer}
                  onChange={(e) => setFaqAnswer(e.target.value)}
                  placeholder="Provide the comprehensive verified answer for the knowledge base..."
                  rows={4}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
                💡 <strong>Admin Review:</strong> This will be submitted as a <em>Pending FAQ Proposal</em> to your Branch/Org Admin for review before going live in customer AI search.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowProposeFaqModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!faqQuestion.trim() || !faqAnswer.trim()) {
                    toast.error("Validation Error", "Please provide both question and answer.");
                    return;
                  }
                  setSubmittingFaq(true);
                  try {
                    const rawOrgId = user?.organization_id?._id || user?.organization_id || ticket.organization_id?._id || ticket.organization_id;
                    const orgId = typeof rawOrgId === "object" && rawOrgId?._id ? rawOrgId._id : rawOrgId;
                    const rawBranchId = user?.branch_id?._id || user?.branch_id || ticket.branch_id?._id || ticket.branch_id;
                    const branchId = typeof rawBranchId === "object" && rawBranchId?._id ? rawBranchId._id : rawBranchId;

                    await FAQAPI.create({
                      question: faqQuestion.trim(),
                      answer: faqAnswer.trim(),
                      category: faqCategory,
                      organization_id: orgId,
                      branch_id: branchId,
                      tags: [ticket.category || "support", "ticket-resolution"],
                    });
                    toast.success("FAQ Proposed", "Submitted to Admin for review and knowledge base inclusion.");
                    setShowProposeFaqModal(false);
                  } catch (err: any) {
                    toast.error("Proposal Failed", err.response?.data?.message || err.message || "Could not propose FAQ");
                  } finally {
                    setSubmittingFaq(false);
                  }
                }}
                disabled={submittingFaq}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-semibold shadow-lg transition flex items-center gap-2"
              >
                {submittingFaq && <Loader2 size={14} className="animate-spin" />}
                Submit Proposal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
