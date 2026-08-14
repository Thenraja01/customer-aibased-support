import { useEffect, useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useAuthContext } from "@/context/AuthContext";
import type { AppDispatch } from "@/store/store";
import { Loader2, AlertCircle, XCircle } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useChatScroll } from "@/hooks/useChatScroll";
import { setActiveChat, clearError } from "@/store/chatSlice";
import { useSocket } from "@/context/SocketContext";
import ChatHeader from "@/components/chat/ChatHeader";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatAPI } from "@/api";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SupportChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, token } = useAuthContext();
  const { socket } = useSocket();
  const queryClient = useQueryClient();
  const toast = useToast();

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
    resetMessages,
  } = useChat();

  const isCreatingRef = useRef(false);
  const { containerRef, handleScroll } = useChatScroll(messages);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  // Streaming & Checklist states
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [agentStatusList, setAgentStatusList] = useState<string[]>([]);
  const [currentStatus, setCurrentStatus] = useState("");
  const [streamingCitations, setStreamingCitations] = useState<any[]>([]);
  const [pendingConfirm, setPendingConfirm] = useState<any | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState("");

  useEffect(() => {
    dispatch(setActiveChat(null));
    resetMessages();
    if (user?._id) {
      loadUserChats();
    }
  }, [user?._id, dispatch, resetMessages, loadUserChats]);

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
        return;
      }
      isCreatingRef.current = true;
      try {
        await startNewChat({
          user_id: user._id,
          organization_id: user.organization_id._id,
          topic: initialMessage.substring(0, 50),
        });
        
        // Wait for state updates then trigger stream
        setTimeout(() => handleSend(initialMessage), 300);
        loadUserChats();
      } catch (err) {
        console.error(err);
      } finally {
        isCreatingRef.current = false;
      }
    },
    [user, startNewChat, handleSend, loadUserChats]
  );

  const handleEndChat = useCallback(async () => {
    if (!activeChat?._id) return;
    setConfirmAction(() => async () => {
      try {
        await ChatAPI.close(activeChat._id);
        loadUserChats();
      } catch (err) {
        console.error(err);
      }
    });
    setConfirmOpen(true);
  }, [activeChat, loadUserChats]);

  // Combined messages to show streaming items
  const displayMessages = [...messages];
  if (isStreaming && lastUserMessage) {
    displayMessages.push({
      _id: "temp-user",
      content: lastUserMessage,
      is_ai: false,
      sender_id: user?._id,
      created_at: new Date().toISOString()
    });

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

  if (!activeChat && !loading) {
    return (
      <>
        <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
          <ChatHeader activeChat={null} isSupportView />
          {error && (
            <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
              <AlertCircle size={14} />
              {error}
            </div>
          )}
          <WelcomeScreen onStartWithMessage={handleStartWithMessage} />
        </div>
        <ConfirmDialog
          open={confirmOpen}
          title="End Chat"
          message="Are you sure you want to end this chat?"
          variant="warning"
          onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
          onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-[calc(100vh-4rem)] bg-background dark:bg-gradient-to-b dark:from-background dark:to-background/80">
        <ChatHeader activeChat={activeChat} isSupportView />

        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {messagesLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <Loader2 size={28} className="animate-spin text-primary" />
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
                  isOwn={msg.sender_id === user?._id}
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

              {/* Pending Action Confirmation */}
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
                onClick={handleEndChat}
                disabled={activeChat.status === "closed"}
                className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
              >
                <XCircle size={14} aria-hidden="true" />
                End Chat
              </button>
            </div>
          )}
          <ChatInput
            onSend={(text) => handleSend(text)}
            disabled={sending || aiThinking || isStreaming || loading}
            chatId={activeChat?._id}
          />
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="End Chat"
        message="Are you sure you want to end this chat?"
        variant="warning"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </>
  );
}
