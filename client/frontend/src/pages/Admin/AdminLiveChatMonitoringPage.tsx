import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { ChatAPI, MessageAPI, TicketAPI, AdminAPI } from "@/api";
import AxiosInstance from "@/api/axiosInstance";
import { SupportQueue } from "@/components/support/SupportQueue";
import { SupportConversation } from "@/components/support/SupportConversation";
import { CustomerContextPanel } from "@/components/support/CustomerContextPanel";
import { TicketContextPanel } from "@/components/support/TicketContextPanel";
import { AgentAssignment } from "@/components/support/AgentAssignment";
import { AIIntelligencePanel } from "@/components/support/AIIntelligencePanel";
import { getRoleSupportPermissions } from "@/config/supportPermissions";
import { Eye, ShieldAlert, Building2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function AdminLiveChatMonitoringPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const permissions = getRoleSupportPermissions("admin");

  const [chats, setChats] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [linkedTicket, setLinkedTicket] = useState<any | null>(null);

  const loadAllOrgData = useCallback(async () => {
    setLoading(true);
    try {
      const [chatsRes, branchesRes, usersRes] = await Promise.all([
        ChatAPI.getAll().catch(() => ({ data: { data: [] } })),
        AxiosInstance.get("/branches").catch(() => ({ data: { data: [] } })),
        AdminAPI.getUsers({ role: "support" }).catch(() => ({ data: { data: [] } })),
      ]);

      const allChats = chatsRes.data?.data || chatsRes.data || [];
      const allBranches = branchesRes.data?.data || branchesRes.data || [];
      const allAgents = usersRes.data?.data || usersRes.data || [];

      setChats(Array.isArray(allChats) ? allChats : []);
      setBranches(Array.isArray(allBranches) ? allBranches : []);
      setAgents(Array.isArray(allAgents) ? allAgents : []);
    } catch (err) {
      console.error("[AdminMonitoring] Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllOrgData();
  }, [loadAllOrgData]);

  // Socket setup
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => loadAllOrgData();
    const handleNewMessage = (data: any) => {
      if (selectedChat && (data.chat_id === selectedChat._id || data.chatId === selectedChat._id)) {
        loadMessages(selectedChat._id);
      }
    };

    socket.on("chat:escalated", handleRefresh);
    socket.on("chat:message", handleNewMessage);
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("chat:escalated", handleRefresh);
      socket.off("chat:message", handleNewMessage);
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, selectedChat, loadAllOrgData]);

  const loadMessages = async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const res = await MessageAPI.getByChat(chatId);
      const raw = res.data?.data || res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.messages) ? raw.messages : [];
      setMessages(list);

      // Fetch linked ticket if exists
      const ticketRes = await TicketAPI.getAll({ chatId }).catch(() => ({ data: { data: [] } }));
      const ticketList = ticketRes.data?.data || ticketRes.data || [];
      setLinkedTicket(ticketList.length > 0 ? ticketList[0] : null);
    } catch (err) {
      console.error("[AdminMonitoring] Failed to load messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectChat = (chat: any) => {
    setSelectedChat(chat);
    loadMessages(chat._id);
  };

  const handleAddInternalNote = async (content: string) => {
    if (!selectedChat?._id || !content.trim()) return;
    try {
      await MessageAPI.send({
        chat_id: selectedChat._id,
        sender_id: user?._id,
        content,
        message_type: "text",
        is_ai: false,
        is_internal_note: true,
      });
      loadMessages(selectedChat._id);
    } catch (err) {
      console.error("[AdminMonitoring] Failed to add internal note:", err);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!selectedChat?._id) return;
    setActionLoading(true);
    try {
      await AxiosInstance.post(`/chats/${selectedChat._id}/accept-handoff`, { agent_id: agentId });
      await loadAllOrgData();
      setSelectedChat((prev: any) => prev ? { ...prev, agent_id: agentId } : null);
    } catch (err) {
      console.error("[AdminMonitoring] Failed to assign agent:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToTicket = async () => {
    if (!selectedChat?._id || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await AxiosInstance.post("/tickets/convert-from-chat", {
        chatId: selectedChat._id,
        subject: `Converted: ${selectedChat.topic || "Customer Support Handoff"}`,
        category: "question",
        priority: "medium",
      });

      if (res.data?.success) {
        toast.success("Ticket Created", `Ticket #${res.data.data.ticket_number || res.data.data._id} created successfully!`);
        setLinkedTicket(res.data.data);
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to convert chat to ticket.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background">
      {/* Header */}
      <div className="border-b bg-card/60 backdrop-blur px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Eye className="text-indigo-500" size={22} />
            Organization Support Monitoring Console
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Supervisory monitoring across all organization branches, active chats, SLA health, and escalations.
          </p>
        </div>

        <Button onClick={loadAllOrgData} variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
          <RefreshCw size={13} /> Refresh Queue
        </Button>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Queue */}
        <div className="w-80 sm:w-96 border-r flex flex-col shrink-0">
          <SupportQueue
            conversations={chats}
            selectedId={selectedChat?._id}
            onSelect={handleSelectChat}
            loading={loading}
            showBranchFilter={true}
            branches={branches}
            agents={agents}
          />
        </div>

        {/* Middle Column: Conversation Timeline */}
        <div className="flex-1 flex flex-col min-w-0 border-r">
          <SupportConversation
            role="admin"
            permissions={permissions}
            conversation={selectedChat}
            messages={messages}
            currentUserId={user?._id}
            loading={messagesLoading}
            actionLoading={actionLoading}
            onAddInternalNote={handleAddInternalNote}
            onConvertToTicket={handleConvertToTicket}
          />
        </div>

        {/* Right Column: Context & Controls */}
        {selectedChat && (
          <div className="w-80 sm:w-96 p-4 space-y-4 overflow-y-auto shrink-0 bg-card/20 hidden lg:block">
            <CustomerContextPanel
              customer={selectedChat.user_id}
              branch={selectedChat.branch_id}
            />

            <AgentAssignment
              currentAgentId={selectedChat.agent_id?._id || selectedChat.agent_id}
              currentAgentName={selectedChat.agent_id?.name}
              agents={agents}
              onAssign={handleAssignAgent}
              disabled={actionLoading}
            />

            <TicketContextPanel
              ticket={linkedTicket}
              conversationId={selectedChat._id}
              onConvertToTicket={handleConvertToTicket}
            />

            <AIIntelligencePanel
              intent={selectedChat.topic || "Payment & Account Inquiry"}
              confidence={selectedChat.ai_confidence || 92}
              escalationReason={selectedChat.escalation_reason || "AI unresolved / Customer requested support"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
