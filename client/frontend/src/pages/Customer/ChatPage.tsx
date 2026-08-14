import { useEffect, useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import type { AppDispatch } from "@/store/store";
import { useAuthContext } from "@/context/AuthContext";
import { Loader2, AlertCircle, TicketCheck, XCircle } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useAutoScroll } from "@/hooks/useAutoScroll";
import { clearError } from "@/store/chatSlice";
import { useSocket } from "@/context/SocketContext";
import { TicketAPI, ChatAPI } from "@/api";
import ChatHeader from "@/components/chat/ChatHeader";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

export default function ChatPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useAuthContext();
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
  const [escalating, setEscalating] = useState(false);
  const [escalated, setEscalated] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
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

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!user?._id) return;
    loadUserChats();
  }, [user?._id, loadUserChats]);

  useEffect(() => {
    if (!user?._id) return;

    const loadSpecificChat = async () => {
      if (chatId) {
        try {
          await loadMessages(chatId);
        } catch (error) {
          console.error("Failed to load chat:", error);
          toast.error("Error", "Failed to load chat");
          navigate("/chat", { replace: true });
        }
      } else {
        resetMessages();
        selectChat(null);
      }
      setIsInitialLoad(false);
    };

    loadSpecificChat();
  }, [chatId, user?._id, loadMessages, resetMessages, selectChat, navigate]);

  useEffect(() => {
    if (activeChat?._id && socket) {
      socket.emit("join:chat", activeChat._id);
      return () => {
        socket.emit("leave:chat", activeChat._id);
      };
    }
  }, [activeChat?._id, socket]);

  useEffect(() => {
    return () => {
      resetMessages();
    };
  }, [resetMessages]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => dispatch(clearError()), 5000);
      return () => clearTimeout(t);
    }
  }, [error, dispatch]);

  // Handle SSE response stream
  const handleSend = useCallback(
    async (text: string, actionConfirmObj: any = null) => {
      if (!text.trim()) return;
      if (!activeChat?._id || !user?._id || isStreaming) {
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

        const response = await fetch(`${baseUrl}/chats/ai/stream`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            chatId: activeChat._id,
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
                setStreamingText((prev) => prev + data.token);
              } else if (data.type === "confirmation") {
                setPendingConfirm(data.pendingAction);
                setIsStreaming(false);
                return;
              } else if (data.type === "done") {
                setStreamingCitations(data.citations || []);
                queryClient.invalidateQueries({ queryKey: ["messages", activeChat._id] });
                setIsStreaming(false);
                setLastUserMessage("");
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
    [activeChat, user, token, isStreaming, queryClient]
  );

  const handleStartWithMessage = useCallback(
    async (initialMessage: string) => {
      if (!user?._id || !user?.organization_id?._id) {
        toast.error("Error", "Unable to start chat");
        return;
      }

      if (isCreatingRef.current) return;
      isCreatingRef.current = true;

      try {
        const chat = await startNewChat({
          user_id: user._id,
          organization_id: user.organization_id._id,
          topic: initialMessage.substring(0, 50),
        });

        if (chat?._id) {
          navigate("/chat", { 
            state: { chatId: chat._id },
            replace: true 
          });
          // Wait for mount then run stream
          setTimeout(() => handleSend(initialMessage), 300);
        }
      } catch (err) {
        toast.error("Error", "Failed to start chat");
      } finally {
        isCreatingRef.current = false;
      }
    },
    [user, startNewChat, handleSend, navigate]
  );

  const handleEscalate = useCallback(async () => {
    if (!activeChat?._id || escalating || activeChat.status === "closed") {
      return;
    }

    setEscalating(true);
    try {
      await TicketAPI.escalateFromChat({ chatId: activeChat._id });
      setEscalated(true);
      toast.success("Success", "Chat escalated to ticket");
    } catch (error) {
      toast.error("Error", "Failed to escalate chat");
    } finally {
      setEscalating(false);
    }
  }, [activeChat, escalating]);

  const handleEndChat = useCallback(async () => {
    if (!activeChat?._id) return;

    try {
      await ChatAPI.close(activeChat._id);
      toast.success("Success", "Chat ended successfully");
      navigate("/chat", { replace: true });
      loadUserChats();
    } catch (err) {
      toast.error("Error", "Failed to end chat");
    }
  }, [activeChat, loadUserChats, navigate]);

  const handleBack = useCallback(() => {
    navigate("/chat", { replace: true });
  }, [navigate]);

  // Combined messages to show streaming items
  const displayMessages = [...messages];
  if (isStreaming && lastUserMessage) {
    // Add temporary user message
    displayMessages.push({
      _id: "temp-user",
      content: lastUserMessage,
      is_ai: false,
      sender_id: user?._id,
      created_at: new Date().toISOString()
    });

    // Add temporary AI message showing current tokens
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

  if (!activeChat && !loading && !messagesLoading && !chatId) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
        <ChatHeader 
          activeChat={null} 
          onBack={handleBack}
        />
        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
            <AlertCircle size={14} aria-hidden="true" />
            <span>{error}</span>
          </div>
        )}
        <WelcomeScreen onStartWithMessage={handleStartWithMessage} />
      </div>
    );
  }

  if ((loading || messagesLoading) && isInitialLoad) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
      <ChatHeader 
        activeChat={activeChat} 
        onBack={chatId ? handleBack : undefined}
      />

      {error && (
        <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
          <AlertCircle size={14} aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto"
      >
        {messagesLoading && !isInitialLoad ? (
          <div className="flex items-center justify-center h-full">
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={28} className="animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">Loading messages...</p>
            </div>
          </div>
        ) : displayMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            {isStreaming ? (
              <TypingIndicator />
            ) : (
              <p className="text-sm text-muted-foreground">Say hello to the AI assistant!</p>
            )}
          </div>
        ) : (
          <div className="py-2">
            {displayMessages.map((msg, idx) => (
              <ChatMessage
                key={msg._id || `${msg.created_at || ""}-${idx}`}
                message={msg}
                isOwn={!msg.is_ai && msg.sender_id === user?._id}
                onEscalate={handleEscalate}
              />
            ))}

            {/* Agent Status Checklist */}
            {isStreaming && (
              <div className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-xl mx-auto my-3 shadow-sm border-dashed">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin text-primary" />
                  Agent Processing States
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { label: "Analyzing Question", status: "Analyzing question" },
                    { label: "Analyzing Capabilities", status: "Checking topic capabilities" },
                    { label: "Searching Knowledge Base", status: "Searching knowledge base" },
                    { label: "Checking Graph Relations", status: "Checking graph relationships" },
                    { label: "Generating Response", status: "Generating response" }
                  ].map((item, index) => {
                    const isMatchedStatus = agentStatusList.some(s => s.toLowerCase().includes(item.status.toLowerCase())) ||
                                            currentStatus.toLowerCase().includes(item.status.toLowerCase());
                    const isCurrent = currentStatus.toLowerCase().includes(item.status.toLowerCase());

                    return (
                      <div key={index} className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          isCurrent ? "bg-amber-500 animate-pulse scale-125" : isMatchedStatus ? "bg-emerald-500" : "bg-slate-350 dark:bg-slate-700"
                        }`} />
                        <span className={isCurrent ? "font-semibold text-slate-850 dark:text-slate-100" : isMatchedStatus ? "text-slate-600 dark:text-slate-350" : "text-slate-400"}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pending Interactive Action Confirmation */}
            {pendingConfirm && (
              <div className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-250 dark:border-amber-900/30 rounded-2xl my-4 max-w-xl mx-auto shadow-sm space-y-3">
                <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <AlertCircle size={14} />
                  Action Confirmation Required
                </div>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed">
                  {pendingConfirm.preview?.message}
                </p>
                <div className="flex items-center gap-2 justify-end pt-1">
                  <button
                    onClick={() => {
                      setPendingConfirm(null);
                      setLastUserMessage("");
                    }}
                    className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 text-slate-500 rounded-xl text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
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

      <div className="border-t bg-background/80 backdrop-blur-xl shrink-0">
        {activeChat && messages.length > 0 && (
          <div className="px-4 py-2 border-b flex gap-2">
            <button
              type="button"
              onClick={handleEscalate}
              disabled={escalating || escalated || activeChat.status === "closed"}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              {escalating ? (
                <Loader2 size={14} className="animate-spin" aria-hidden="true" />
              ) : (
                <TicketCheck size={14} aria-hidden="true" />
              )}
              {escalated ? "Escalated to Ticket" : "Escalate to Ticket"}
            </button>
            <button
              type="button"
              onClick={() => setConfirmOpen(true)}
              disabled={activeChat.status === "closed"}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <XCircle size={14} aria-hidden="true" />
              End Chat
            </button>
          </div>
        )}
        <ChatInput
          onSend={(text) => handleSend(text)}
          disabled={sending || aiThinking || isStreaming || loading || !activeChat}
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
    </div>
  );
}