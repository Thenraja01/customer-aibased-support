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
import { Building2, ShieldAlert, RefreshCw, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";

export default function BranchLiveSupportPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();
  const permissions = getRoleSupportPermissions("branch_admin");

  const [chats, setChats] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [linkedTicket, setLinkedTicket] = useState<any | null>(null);

  const branchId = user?.branch_id?._id || user?.branch_id;
  const branchName = user?.branch_id?.name || "My Branch";

  const loadBranchData = useCallback(async () => {
    setLoading(true);
    try {
      const [chatsRes, usersRes] = await Promise.all([
        ChatAPI.getAll({ branch_id: branchId }).catch(() => ({ data: { data: [] } })),
        AdminAPI.getUsers({ role: "support", branchId }).catch(() => ({ data: { data: [] } })),
      ]);

      const allChats = chatsRes.data?.data || chatsRes.data || [];
      const allAgents = usersRes.data?.data || usersRes.data || [];

      setChats(Array.isArray(allChats) ? allChats : []);
      setAgents(Array.isArray(allAgents) ? allAgents : []);
    } catch (err) {
      console.error("[BranchLiveSupport] Failed to load branch data:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    loadBranchData();
  }, [loadBranchData]);

  // Socket listener
  useEffect(() => {
    if (!socket) return;
    const handleRefresh = () => loadBranchData();
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
  }, [socket, selectedChat, loadBranchData]);

  const loadMessages = async (chatId: string) => {
    setMessagesLoading(true);
    try {
      const res = await MessageAPI.getByChat(chatId);
      const raw = res.data?.data || res.data;
      const list = Array.isArray(raw) ? raw : Array.isArray(raw?.messages) ? raw.messages : [];
      setMessages(list);

      const ticketRes = await TicketAPI.getAll({ chatId }).catch(() => ({ data: { data: [] } }));
      const ticketList = ticketRes.data?.data || ticketRes.data || [];
      setLinkedTicket(ticketList.length > 0 ? ticketList[0] : null);
    } catch (err) {
      console.error("[BranchLiveSupport] Failed to load messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectChat = (chat: any) => {
    setSelectedChat(chat);
    loadMessages(chat._id);
  };

  const handleSendPublicMessage = async (content: string) => {
    if (!selectedChat?._id || !content.trim()) return;
    try {
      await MessageAPI.send({
        chat_id: selectedChat._id,
        sender_id: user?._id,
        content,
        message_type: "text",
        is_ai: false,
      });
      loadMessages(selectedChat._id);
    } catch (err) {
      console.error("[BranchLiveSupport] Error sending message:", err);
    }
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
      console.error("[BranchLiveSupport] Error adding internal note:", err);
    }
  };

  const handleAssignAgent = async (agentId: string) => {
    if (!selectedChat?._id) return;
    setActionLoading(true);
    try {
      await AxiosInstance.post(`/chats/${selectedChat._id}/accept-handoff`, { agent_id: agentId });
      await loadBranchData();
      setSelectedChat((prev: any) => (prev ? { ...prev, agent_id: agentId } : null));
    } catch (err) {
      console.error("[BranchLiveSupport] Error assigning agent:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedChat?._id || actionLoading) return;
    setActionLoading(true);
    try {
      await AxiosInstance.post(`/chats/${selectedChat._id}/handoff`, {
        reason: "branch_admin_escalation",
      });
      toast.success("Escalated", "Conversation escalated to senior queue.");
      await loadBranchData();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to escalate.");
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
        subject: `Converted: ${selectedChat.topic || "Branch Support Handoff"}`,
        category: "question",
        priority: "medium",
      });

      if (res.data?.success) {
        toast.success("Ticket Created", `Ticket #${res.data.data.ticket_number || res.data.data._id} created!`);
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
      {/* Header Bar */}
      <div className="border-b bg-card/60 backdrop-blur px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Building2 className="text-primary" size={22} />
            Branch Live Support Console — <span className="text-primary">{branchName}</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Operational 3-column live support workspace for managing branch chat queue, agent assignments, and escalations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-bold text-xs">
            Scope: {branchName}
          </Badge>
          <Button onClick={loadBranchData} variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
            <RefreshCw size={13} /> Refresh Queue
          </Button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Branch Chat Queue */}
        <div className="w-80 sm:w-96 border-r flex flex-col shrink-0">
          <SupportQueue
            conversations={chats}
            selectedId={selectedChat?._id}
            onSelect={handleSelectChat}
            loading={loading}
            agents={agents}
          />
        </div>

        {/* Middle Column: Customer Conversation Timeline */}
        <div className="flex-1 flex flex-col min-w-0 border-r">
          <SupportConversation
            role="branch_admin"
            permissions={permissions}
            conversation={selectedChat}
            messages={messages}
            currentUserId={user?._id}
            loading={messagesLoading}
            actionLoading={actionLoading}
            onSendPublicMessage={handleSendPublicMessage}
            onAddInternalNote={handleAddInternalNote}
            onEscalate={handleEscalate}
            onConvertToTicket={handleConvertToTicket}
          />
        </div>

        {/* Right Column: Branch Control Panel */}
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
              intent={selectedChat.topic || "Support Handoff"}
              confidence={selectedChat.ai_confidence || 88}
              escalationReason={selectedChat.escalation_reason || "Customer requested live support"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
