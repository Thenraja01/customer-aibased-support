import { useEffect, useCallback, useRef, useState, memo } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppDispatch } from "@/store/store";
import { useAuthContext } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  Loader2, AlertCircle, Sparkles,
  RefreshCw, CreditCard, ShieldCheck, Ticket
} from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { clearError } from "@/store/chatSlice";
import { useSocket } from "@/context/SocketContext";
import { ChatAPI } from "@/api";
import ChatHeader from "@/components/chat/ChatHeader";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import AIProcessingSteps from "@/components/chat/AIProcessingSteps";
import EscalationDrawer from "@/components/ticket/EscalationDrawer";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

/* ─── Inline Welcome Shortcuts (rendered inside the message scroll area) ─── */
const SHORTCUTS = [
  {
    icon: RefreshCw,
    title: "Refund & Return Policy",
    desc: "Check eligibility from docs",
    query: "What are the refund and return policies according to our knowledge base?",
    color: "emerald",
  },
  {
    icon: CreditCard,
    title: "Billing & Invoices",
    desc: "Payment methods & receipts",
    query: "Explain billing cycles, tax receipts, and payment method updates from the documentation.",
    color: "cyan",
  },
  {
    icon: ShieldCheck,
    title: "Security & 2FA Setup",
    desc: "Multi-factor auth guide",
    query: "Provide step-by-step documentation for configuring Two-Factor Authentication and password reset.",
    color: "amber",
  },
  {
    icon: Ticket,
    title: "Create Support Ticket",
    desc: "AI-guided incident logging",
    query: "I need to file a formal support ticket. Please guide me through collecting the required incident details.",
    color: "indigo",
  },
];

const colorMap: Record<string, { border: string; iconBg: string; hover: string }> = {
  emerald: { border: "border-emerald-500/25 hover:border-emerald-400/50", iconBg: "bg-emerald-500/10 text-emerald-400", hover: "hover:bg-emerald-500/5" },
  cyan:    { border: "border-cyan-500/25 hover:border-cyan-400/50",       iconBg: "bg-cyan-500/10 text-cyan-400",       hover: "hover:bg-cyan-500/5" },
  amber:   { border: "border-amber-500/25 hover:border-amber-400/50",     iconBg: "bg-amber-500/10 text-amber-400",     hover: "hover:bg-amber-500/5" },
  indigo:  { border: "border-indigo-500/25 hover:border-indigo-400/50",   iconBg: "bg-indigo-500/10 text-indigo-400",   hover: "hover:bg-indigo-500/5" },
};

const InlineWelcome = memo(function InlineWelcome({
  onAction, botName, firstName, isCreating,
}: {
  onAction: (query: string) => void;
  botName: string;
  firstName: string;
  isCreating: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 sm:py-12 w-full max-w-xl mx-auto select-none">
      {/* AI Badge */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative mb-4"
      >
        <div className="absolute w-20 h-20 rounded-full bg-primary/20 blur-2xl animate-pulse pointer-events-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary via-emerald-400 to-teal-400 p-[1.5px] shadow-[0_0_25px_rgba(16,185,129,0.3)]">
          <div className="w-full h-full rounded-[13px] bg-neutral-950 flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-emerald-400" />
          </div>
        </div>
      </motion.div>

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06, duration: 0.25 }}
        className="text-center mb-5 space-y-1"
      >
        <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
          How can I help you, <span className="bg-gradient-to-r from-primary via-emerald-400 to-teal-400 bg-clip-text text-transparent">{firstName}</span>?
        </h2>
        <p className="text-[11px] text-muted-foreground max-w-sm mx-auto leading-relaxed">
          Connected to verified knowledge docs · {botName}
        </p>
      </motion.div>

      {/* Shortcut Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.12, duration: 0.25 }}
        className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full"
      >
        {SHORTCUTS.map((item, idx) => {
          const Icon = item.icon;
          const c = colorMap[item.color] || colorMap.emerald;
          return (
            <button
              key={idx}
              type="button"
              disabled={isCreating}
              onClick={() => onAction(item.query)}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl border bg-card/60 backdrop-blur-sm ${c.border} ${c.hover} text-left transition-all duration-150 active:scale-[0.97] group disabled:opacity-50 disabled:cursor-wait disabled:pointer-events-none`}
            >
              <div className={`p-1.5 rounded-lg ${c.iconBg} shrink-0 transition-transform group-hover:scale-110`}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{item.desc}</p>
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* AI Processing Loader */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 mt-4 px-4 py-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary"
        >
          <Loader2 size={14} className="animate-spin" />
          <span className="text-xs font-semibold">Creating session &amp; connecting to AI engine...</span>
        </motion.div>
      )}
    </div>
  );
});

/* ─── Main ChatPage ─── */
export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const dispatch = useDispatch<AppDispatch>();
  const { user, token, orgSettings } = useAuthContext();
  const { socket } = useSocket();
  const queryClient = useQueryClient();

  const {
    activeChat,
    messages,
    loading,
    messagesLoading,
    sending,
    aiThinking,
    error,
    loadUserChats,
    startNewChat,
    loadMessages,
    resetMessages,
    selectChat,
  } = useChat();

  const toast = useToast();
  const isCreatingRef = useRef(false);
  const isMountedRef = useRef(true);
  const { containerRef, handleScroll } = useAutoScroll(messages);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [escalationDrawerOpen, setEscalationDrawerOpen] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Streaming & Live agent status checklist states
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [agentStatusList, setAgentStatusList] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<any[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<any | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState("");

  const chatId = location.state?.chatId || new URLSearchParams(location.search).get('id');
  const botName = orgSettings?.chatbot_name || "Support AI";
  const firstName = user?.name ? user.name.split(" ")[0] : "there";
  const hasNoChat = !activeChat && !chatId;

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    loadUserChats();
  }, [user?._id, loadUserChats]);

  const basePath = location.pathname.startsWith("/admin")
    ? "/admin/chatbot"
    : location.pathname.startsWith("/branch")
    ? "/branch/chatbot"
    : location.pathname.startsWith("/support")
    ? "/support/chatbot"
    : "/chat";

  useEffect(() => {
    if (!user?._id) return;

    const loadSpecificChat = async () => {
      if (chatId) {
        try {
          await loadMessages(chatId);
        } catch (error) {
          console.error("Failed to load chat:", error);
          toast.error("Error", "Failed to load chat");
          navigate(basePath, { replace: true });
        }
      } else {
        resetMessages();
        selectChat(null);
      }
      setIsInitialLoad(false);
    };

    loadSpecificChat();
  }, [chatId, user?._id, loadMessages, resetMessages, selectChat, navigate, basePath]);

  useEffect(() => {
    if (activeChat?._id && socket) {
      socket.emit("join:chat", activeChat._id);
      return () => {
        socket.emit("leave:chat", activeChat._id);
      };
    }
  }, [activeChat?._id, socket]);

  useEffect(() => {
    return () => { resetMessages(); };
  }, [resetMessages]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  // Handle SSE response stream
  const handleSend = useCallback(
    async (text: string, actionConfirmObj: any = null, targetChatId?: string) => {
      if (!text.trim()) return;
      const effectiveChatId = targetChatId || activeChat?._id;
      if (!effectiveChatId || !user?._id || isStreaming) {
        toast.warning("Warning", "Please wait for the current message to complete");
        return;
      }

      setLastUserMessage(text);
      setIsStreaming(true);
      setStreamingText("");
      setAgentStatusList([]);
      setCurrentStatus("Analyzing question");
      setStreamingCitations([]);
      setPendingConfirm(null);

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3030";
        const baseUrl = backendUrl.endsWith("/") ? backendUrl.slice(0, -1) : backendUrl;
        const authToken = token || localStorage.getItem("token") || "";

        const response = await fetch(`${baseUrl}/chats/ai/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": authToken.startsWith("Bearer ") ? authToken : `Bearer ${authToken}`
          },
          body: JSON.stringify({
            chatId: effectiveChatId,
            message: text,
            actionConfirm: actionConfirmObj
          })
        });

        if (!response.body) {
          throw new Error("No response stream body available.");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulatedStreamText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim()) continue;
            const sseData = line.startsWith("data: ") ? line.slice(6) : line;
            if (!sseData.trim()) continue;

            try {
              const data = JSON.parse(sseData);
              if (data.type === "status") {
                setCurrentStatus(data.status);
                setAgentStatusList((prev) => [...new Set([...prev, data.status])]);
              } else if (data.type === "token") {
                accumulatedStreamText += data.token;
                setStreamingText(accumulatedStreamText);
              } else if (data.type === "confirmation") {
                setPendingConfirm(data.pendingAction);
                setIsStreaming(false);
                return;
              } else if (data.type === "done") {
                const finalText = data.text || accumulatedStreamText;
                const citations = data.citations || [];
                setStreamingCitations(citations);

                // Seed React Query cache immediately so messages never vanish
                queryClient.setQueryData(["messages", effectiveChatId], (old: any) => {
                  const list = Array.isArray(old) ? [...old] : [];
                  if (text && !list.some((m: any) => m.content === text && !m.is_ai)) {
                    list.push({
                      _id: `user-${Date.now()}`,
                      content: text,
                      is_ai: false,
                      sender_id: user?._id,
                      created_at: new Date().toISOString(),
                    });
                  }
                  if (finalText) {
                    list.push({
                      _id: data.messageId || `ai-${Date.now()}`,
                      content: finalText,
                      is_ai: true,
                      sender_id: "ai",
                      confidence: data.confidence,
                      citations: citations,
                      quickActions: data.quickActions || [],
                      escalation: data.escalation,
                      created_at: new Date().toISOString(),
                    });
                  }
                  return list;
                });

                setIsStreaming(false);
                setStreamingText("");
                setLastUserMessage("");
                queryClient.invalidateQueries({ queryKey: ["messages", effectiveChatId] });
                return;
              } else if (data.type === "error") {
                throw new Error(data.message);
              }
            } catch (err) {}
          }
        }
      } catch (err: any) {
        console.error("Streaming error:", err);
        toast.error("Error", err.message || "Failed to get response");
        setIsStreaming(false);
      }
    },
    [activeChat, user, token, isStreaming, queryClient, toast]
  );

  const handleStartWithMessage = useCallback(
    async (initialMessage: string) => {
      const orgId = user?.organization_id?._id || user?.organization_id || "global";
      if (!user?._id) {
        toast.error("Error", "Please log in to start a chat");
        return;
      }

      if (isCreatingRef.current) return;
      isCreatingRef.current = true;

      try {
        const chat = await startNewChat({
          user_id: user._id,
          organization_id: typeof orgId === "object" ? orgId._id : orgId,
          topic: initialMessage.substring(0, 50),
        });

        if (chat?._id) {
          selectChat(chat);
          loadMessages(chat._id);
          navigate(basePath, {
            state: { chatId: chat._id },
            replace: true
          });
          // Immediately trigger AI response stream
          handleSend(initialMessage, null, chat._id);
        }
      } catch (err: any) {
        toast.error("Error", err?.message || "Failed to start chat session");
      } finally {
        isCreatingRef.current = false;
      }
    },
    [user, startNewChat, selectChat, loadMessages, handleSend, navigate, toast, basePath]
  );

  const handleEscalate = useCallback(async () => {
    if (!activeChat?._id) return;
    setEscalationDrawerOpen(true);
  }, [activeChat]);

  const handleEndChat = useCallback(async () => {
    if (!activeChat?._id) return;

    try {
      await ChatAPI.close(activeChat._id);
      toast.success("Success", "Chat ended successfully");
      navigate(basePath, { replace: true });
      loadUserChats();
    } catch (err) {
      toast.error("Error", "Failed to end chat");
    }
  }, [activeChat, loadUserChats, navigate, basePath]);

  const handleBack = useCallback(() => {
    navigate(basePath, { replace: true });
  }, [navigate, basePath]);

  // Combined messages: prevent duplicate user message rendering
  const displayMessages = [...messages];
  if (isStreaming && lastUserMessage) {
    const lastMsgInList = messages.length > 0 ? messages[messages.length - 1] : null;
    const isAlreadyInList = lastMsgInList && !lastMsgInList.is_ai && lastMsgInList.content === lastUserMessage;

    if (!isAlreadyInList) {
      displayMessages.push({
        _id: "temp-user",
        content: lastUserMessage,
        is_ai: false,
        sender_id: user?._id,
        created_at: new Date().toISOString()
      });
    }

    if (streamingText) {
      displayMessages.push({
        _id: "temp-ai",
        content: streamingText,
        is_ai: true,
        sender_id: "ai",
        created_at: new Date().toISOString(),
        citations: streamingCitations
      } as any);
    }
  }

  // Loading spinner
  if ((loading || messagesLoading) && isInitialLoad) {
    return (
      <div className="flex items-center justify-center h-full w-full flex-1">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  /* ─── Single Unified Chat Layout ─── */
  return (
    <div className="flex flex-col h-full w-full flex-1 bg-background relative overflow-hidden">
      {/* Ambient Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

      {/* Header - always visible */}
      <ChatHeader
        activeChat={activeChat}
        onBack={chatId ? handleBack : undefined}
        onOpenEscalation={activeChat ? () => setEscalationDrawerOpen(true) : undefined}
      />

      {/* Error Banner */}
      {error && (
        <div className="mx-4 mt-2 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2 text-xs text-destructive max-w-3xl self-center w-full shadow-sm shrink-0">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      {/* Scrollable Message Area (includes inline welcome when no chat) */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto relative z-[1]"
      >
        {messagesLoading && !isInitialLoad ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : displayMessages.length === 0 ? (
          /* ─── Inline Welcome ─── */
          <InlineWelcome
            onAction={handleStartWithMessage}
            botName={botName}
            firstName={firstName}
            isCreating={isStreaming || sending}
          />
        ) : (
          <div className="py-2">
            {displayMessages.map((msg, idx) => (
              <ChatMessage
                key={msg._id || `${msg.created_at || ""}-${idx}`}
                message={msg}
                isOwn={!msg.is_ai}
                onEscalate={handleEscalate}
                onQuickAction={(q) => handleSend(q)}
              />
            ))}

            {/* Enterprise Intelligent AI Processing Loader */}
            {(aiThinking || isStreaming) && (
              <AIProcessingSteps
                currentStatus={currentStatus}
                statusList={agentStatusList}
                isStreaming={aiThinking || isStreaming}
                onOpenTicket={() => navigate("/customer/tickets")}
                onConnectAgent={() => handleEscalate?.()}
              />
            )}

            {/* Pending Interactive Action Confirmation */}
            {pendingConfirm && (
              <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl my-4 max-w-xl mx-auto shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <AlertCircle size={14} />
                  Action Confirmation Required
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {pendingConfirm.preview?.message}
                </p>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    onClick={() => {
                      setPendingConfirm(null);
                      setLastUserMessage("");
                    }}
                    className="px-3 py-1.5 border border-border text-muted-foreground rounded-xl text-xs font-medium hover:bg-muted transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      const action = pendingConfirm.action;
                      const payload = pendingConfirm.payload;
                      setPendingConfirm(null);
                      handleSend(lastUserMessage, { action, confirmed: true, payload });
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-medium shadow-sm transition-all"
                  >
                    Approve Action
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Input Bar */}
      <div className="bg-background/80 backdrop-blur-xl shrink-0 relative z-[2]">
        <ChatInput
          onSend={(text) => hasNoChat ? handleStartWithMessage(text) : handleSend(text)}
          disabled={sending || aiThinking || isStreaming || loading}
          chatId={activeChat?._id}
        />
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleEndChat}
        title="End Chat"
        message="Are you sure you want to end this chat? This action cannot be undone."
        confirmLabel="End Chat"
        cancelLabel="Cancel"
        variant="danger"
      />

      {/* Escalation Drawer */}
      {activeChat && (
        <EscalationDrawer
          open={escalationDrawerOpen}
          onClose={() => setEscalationDrawerOpen(false)}
          chatId={activeChat._id}
          conversationSnippet={messages.map((m: any) => `${m.is_ai ? 'AI' : 'User'}: ${m.content}`).slice(-6).join('\n\n')}
          onEscalated={() => {
            setEscalationDrawerOpen(false);
            loadUserChats();
            toast.success("Success", "Ticket created from conversation transcript");
          }}
        />
      )}
    </div>
  );
}