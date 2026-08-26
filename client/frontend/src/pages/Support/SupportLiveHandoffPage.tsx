import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSocket } from "@/context/SocketContext";
import { ChatAPI, MessageAPI, TicketAPI } from "@/api";
import AxiosInstance from "@/api/axiosInstance";
import { SupportQueue } from "@/components/support/SupportQueue";
import { SupportConversation } from "@/components/support/SupportConversation";
import { CustomerContextPanel } from "@/components/support/CustomerContextPanel";
import { TicketContextPanel } from "@/components/support/TicketContextPanel";
import { AIIntelligencePanel } from "@/components/support/AIIntelligencePanel";
import { getRoleSupportPermissions } from "@/config/supportPermissions";
import { UserCheck, RefreshCw, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";

export default function SupportLiveHandoffPage() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const permissions = getRoleSupportPermissions("support");

  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedChat, setSelectedChat] = useState<any | null>(null);

  const [messages, setMessages] = useState<any[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [linkedTicket, setLinkedTicket] = useState<any | null>(null);

  const loadAllHandoffs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await ChatAPI.getAll();
      const all = res.data?.data || res.data || [];
      setChats(Array.isArray(all) ? all : []);
    } catch (err) {
      console.error("[SupportLiveHandoff] Failed to load chats:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllHandoffs();
  }, [loadAllHandoffs]);

  // Socket
  useEffect(() => {
    if (!socket) return;
    const handleEscalated = () => loadAllHandoffs();
    const handleNewMessage = (data: any) => {
      if (selectedChat && (data.chat_id === selectedChat._id || data.chatId === selectedChat._id)) {
        loadMessages(selectedChat._id);
      }
    };

    socket.on("chat:escalated", handleEscalated);
    socket.on("chat:message", handleNewMessage);
    socket.on("message:new", handleNewMessage);

    return () => {
      socket.off("chat:escalated", handleEscalated);
      socket.off("chat:message", handleNewMessage);
      socket.off("message:new", handleNewMessage);
    };
  }, [socket, selectedChat, loadAllHandoffs]);

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
      console.error("[SupportLiveHandoff] Failed to load messages:", err);
    } finally {
      setMessagesLoading(false);
    }
  };

  const handleSelectChat = (chat: any) => {
    setSelectedChat(chat);
    loadMessages(chat._id);
  };

  const handleAcceptHandoff = async (chat: any) => {
    setActionLoading(true);
    try {
      await AxiosInstance.post(`/chats/${chat._id}/accept-handoff`, {
        agent_id: user?._id,
      });

      await loadAllHandoffs();
      const updated = { ...chat, status: "in_progress", agent_id: user?._id };
      handleSelectChat(updated);
    } catch (err) {
      console.error("[SupportLiveHandoff] Error accepting chat:", err);
    } finally {
      setActionLoading(false);
    }
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
      console.error("[SupportLiveHandoff] Error sending message:", err);
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
      console.error("[SupportLiveHandoff] Error adding internal note:", err);
    }
  };

  const toast = useToast();

  const handleResolve = async () => {
    if (!selectedChat?._id || actionLoading) return;
    setActionLoading(true);
    try {
      await ChatAPI.close(selectedChat._id);
      toast.success("Resolved", "Conversation marked as RESOLVED.");
      setSelectedChat(null);
      await loadAllHandoffs();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to resolve conversation.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async () => {
    if (!selectedChat?._id || actionLoading) return;
    setActionLoading(true);
    try {
      await AxiosInstance.post(`/chats/${selectedChat._id}/handoff`, {
        reason: "support_agent_escalation",
      });
      toast.success("Escalated", "Conversation escalated to senior / branch admin queue.");
      await loadAllHandoffs();
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
        subject: `Converted: ${selectedChat.topic || "Customer Support Handoff"}`,
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
      {/* Top Bar Header */}
      <div className="border-b bg-card/60 backdrop-blur px-6 py-4 flex items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <UserCheck className="text-amber-500" size={22} />
            Support Agent Live Handoff Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Handle assigned customer live chats, reply in real-time, record internal notes, and resolve/escalate issues.
          </p>
        </div>

        <Button onClick={loadAllHandoffs} variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
          <RefreshCw size={13} /> Refresh Queue
        </Button>
      </div>

      {/* 3-Column Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side: Queue */}
        <div className="w-80 sm:w-96 border-r flex flex-col shrink-0">
          <SupportQueue
            conversations={chats}
            selectedId={selectedChat?._id}
            onSelect={handleSelectChat}
            onAcceptHandoff={handleAcceptHandoff}
            loading={loading}
          />
        </div>

        {/* Middle Side: Live Chat Engine */}
        <div className="flex-1 flex flex-col min-w-0 border-r">
          <SupportConversation
            role="support"
            permissions={permissions}
            conversation={selectedChat}
            messages={messages}
            currentUserId={user?._id}
            loading={messagesLoading}
            actionLoading={actionLoading}
            onSendPublicMessage={handleSendPublicMessage}
            onAddInternalNote={handleAddInternalNote}
            onResolve={handleResolve}
            onEscalate={handleEscalate}
            onConvertToTicket={handleConvertToTicket}
          />
        </div>

        {/* Right Side: Context Panels */}
        {selectedChat && (
          <div className="w-80 sm:w-96 p-4 space-y-4 overflow-y-auto shrink-0 bg-card/20 hidden lg:block">
            <CustomerContextPanel
              customer={selectedChat.user_id}
              branch={selectedChat.branch_id}
            />

            <TicketContextPanel
              ticket={linkedTicket}
              conversationId={selectedChat._id}
              onConvertToTicket={handleConvertToTicket}
            />

            <AIIntelligencePanel
              intent={selectedChat.topic || "Support Request"}
              confidence={selectedChat.ai_confidence || 90}
              escalationReason={selectedChat.escalation_reason || "Customer requested human support"}
            />
          </div>
        )}
      </div>
    </div>
  );
}
