import { useEffect, useCallback, useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/context/AuthContext";
import type { AppDispatch } from "@/store/store";
import { Loader2, AlertCircle, XCircle, User, Sparkles, Ticket, BookOpen, FileText, Zap, Copy, Check, MessageSquare, Shield, HelpCircle, ArrowRight } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { useChatScroll } from "@/hooks/useChatScroll";
import { setActiveChat, clearError } from "@/store/chatSlice";
import { useSocket } from "@/context/SocketContext";
import ChatHeader from "@/components/chat/ChatHeader";
import WelcomeScreen from "@/components/chat/WelcomeScreen";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import AIProcessingSteps from "@/components/chat/AIProcessingSteps";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ChatAPI, FAQAPI } from "@/api";
import { useToast } from "@/components/ui/toast";
import { useQueryClient } from "@tanstack/react-query";

export default function SupportChatPage() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
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
    selectChat,
    loadMessages,
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

  // Live Escalated Customer Chats State
  const [escalatedChats, setEscalatedChats] = useState<any[]>([]);
  const [handoffTakenOver, setHandoffTakenOver] = useState(false);

  // Enterprise Copilot Sidebar State
  const [sidebarTab, setSidebarTab] = useState<"macros" | "sources" | "faqs">("macros");
  const [topFaqs, setTopFaqs] = useState<any[]>([]);
  const [copiedFaqId, setCopiedFaqId] = useState<string | null>(null);

  useEffect(() => {
    FAQAPI.getActive().then((res: any) => {
      if (res.data?.success && Array.isArray(res.data.data)) {
        setTopFaqs(res.data.data.slice(0, 6));
      }
    }).catch(() => {});
  }, []);

  const fetchEscalatedChats = useCallback(async () => {
    try {
      const res = await ChatAPI.getAll();
      if (res.data.success) {
        const list = res.data.data.filter((c: any) => c.status === "escalated" || c.is_escalated || c.status === "in_progress");
        setEscalatedChats(list);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    fetchEscalatedChats();
    const interval = setInterval(fetchEscalatedChats, 10000);
    return () => clearInterval(interval);
  }, [fetchEscalatedChats]);

  useEffect(() => {
    if (socket) {
      const handleEscalated = () => {
        toast.info("Escalation Alert", "A customer has requested live human support!");
        fetchEscalatedChats();
      };
      socket.on("chat:escalated", handleEscalated);
      return () => {
        socket.off("chat:escalated", handleEscalated);
      };
    }
  }, [socket, fetchEscalatedChats, toast]);

  const selectAndTakeoverChat = async (chat: any) => {
    dispatch(setActiveChat(chat));
    setHandoffTakenOver(true);
    try {
      if (chat.status === "escalated") {
        await ChatAPI.update(chat._id, { status: "in_progress", is_escalated: false });
        fetchEscalatedChats();
      }
      toast.success("Joined Session", `Joined live support session with ${chat.user_id?.name || "Customer"}`);
    } catch {
      /* fallthrough */
    }
  };

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

  const handleSend = useCallback(
    async (text: string, actionConfirmObj: any = null, targetChatId?: string) => {
      if (!text.trim()) return;
      const effectiveChatId = targetChatId || activeChat?._id;
      if (!effectiveChatId || !user?._id || isStreaming) {
        return;
      }

      if (activeChat && (activeChat.is_escalated || activeChat.status === "escalated" || activeChat.status === "in_progress" || activeChat.status === "HUMAN_ACTIVE" || activeChat.status === "HUMAN_QUEUED")) {
        try {
          const { MessageAPI } = await import("@/api/message.api.js");
          await MessageAPI.send({
            chat_id: effectiveChatId,
            sender_id: user._id,
            content: text,
            message_type: "text",
            is_ai: false
          });
          queryClient.invalidateQueries({ queryKey: ["messages", effectiveChatId] });
        } catch (err: any) {
          toast.error("Error", err.message || "Failed to send message");
        }
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
      const rawOrgId = user?.organization_id?._id || user?.organization_id || "global";
      const orgId = typeof rawOrgId === "object" && rawOrgId?._id ? rawOrgId._id : rawOrgId;
      if (!user?._id) {
        toast.error("Error", "Please log in to start a chat");
        return;
      }
      if (isCreatingRef.current) return;
      isCreatingRef.current = true;
      try {
        const chat = await startNewChat({
          user_id: user._id,
          organization_id: orgId,
          topic: initialMessage.substring(0, 50),
        });

        if (chat?._id) {
          selectChat(chat);
          loadMessages(chat._id);
          navigate("/support/ai", {
            state: { chatId: chat._id },
            replace: true
          });
          handleSend(initialMessage, null, chat._id);
          loadUserChats();
        }
      } catch (err: any) {
        console.error(err);
        toast.error("Error", err?.message || "Failed to start chat session");
      } finally {
        isCreatingRef.current = false;
      }
    },
    [user, startNewChat, selectChat, loadMessages, handleSend, loadUserChats, navigate, toast]
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

  if (!activeChat) {
    return (
      <>
        <div className="flex flex-col h-full w-full flex-1 bg-background relative overflow-hidden">
          <ChatHeader activeChat={null} isSupportView />
          {error && (
            <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive max-w-3xl self-center w-full">
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

        {/* Live Customer Support Requests Bar */}
        {(() => {
          const liveEscalations = escalatedChats.filter((c: any) => ["HUMAN_QUEUED", "in_progress", "escalated", "HUMAN_ACTIVE"].includes(c.status));
          if (liveEscalations.length === 0) return null;
          return (
            <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between gap-3 overflow-x-auto shrink-0">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                Live Customer Support Requests ({liveEscalations.length})
              </div>
              <div className="flex items-center gap-2 overflow-x-auto">
                {liveEscalations.map((c) => (
                  <button
                    key={c._id}
                    onClick={() => selectAndTakeoverChat(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0 ${
                      activeChat?._id === c._id
                        ? "bg-amber-500 text-black shadow-sm"
                        : "bg-amber-500/20 text-amber-700 dark:text-amber-300 hover:bg-amber-500/30"
                    }`}
                  >
                    <span>{c.user_id?.name || `Customer #${c._id.slice(-6)}`}</span>
                    <span className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded uppercase">
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })()}

        {error && (
          <div className="mx-6 mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive dark:bg-destructive/15 max-w-3xl self-center w-full">
            <AlertCircle size={14} />
            {error}
          </div>
        )}

        {/* Split Screen Chat + Staff Copilot / Customer Context Drawer */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
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
                  isOwn={!msg.is_ai}
                />
              ))}

              {/* Enterprise Intelligent AI Processing Loader */}
              {(aiThinking || isStreaming) && (
                <AIProcessingSteps
                  currentStatus={currentStatus}
                  statusList={agentStatusList}
                  isStreaming={aiThinking || isStreaming}
                />
              )}
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

          {/* Right Workspace Sidepanel */}
          {activeChat && (
            <div className="w-80 border-l bg-card/70 backdrop-blur-md p-4 overflow-y-auto hidden lg:flex flex-col gap-3.5 text-xs shrink-0">
              
              {/* Tab Selector */}
              <div className="flex items-center p-1 rounded-xl bg-muted/60 border border-border/50 text-[11px] font-semibold">
                <button
                  onClick={() => setSidebarTab("macros")}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    sidebarTab === "macros" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Zap size={13} />
                  <span>Macros</span>
                </button>
                <button
                  onClick={() => setSidebarTab("sources")}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    sidebarTab === "sources" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <BookOpen size={13} />
                  <span>RAG Docs</span>
                </button>
                <button
                  onClick={() => setSidebarTab("faqs")}
                  className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    sidebarTab === "faqs" ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <HelpCircle size={13} />
                  <span>FAQs</span>
                </button>
              </div>

              {/* Customer Escalation Context (if session is escalated) */}
              {(activeChat.is_escalated || activeChat.status === "HUMAN_ACTIVE" || activeChat.status === "HUMAN_QUEUED") && (
                <div className="space-y-2 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <div className="text-[10px] text-amber-500 uppercase font-bold flex items-center gap-1">
                    <User size={12} /> Live Customer Escalation
                  </div>
                  <div className="font-semibold text-slate-200">{activeChat.user_id?.name || "Customer Session"}</div>
                  <div className="text-muted-foreground font-mono text-[11px] truncate">{activeChat.user_id?.email || `ID: ${activeChat._id}`}</div>
                </div>
              )}

              {/* TAB 1: QUICK ACTION MACROS */}
              {sidebarTab === "macros" && (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                    <Zap size={12} />
                    Staff AI Action Shortcuts
                  </div>
                  {[
                    { title: "Refund Policy Summary", prompt: "Summarize the customer return and refund policy with step-by-step return timeframes." },
                    { title: "Query Open Tickets", prompt: "How many open and in-progress tickets are currently in the queue?" },
                    { title: "Draft Customer Apology", prompt: "Draft a polite and empathetic customer service apology email for a delayed shipment." },
                    { title: "Warranty Checklist", prompt: "What are our warranty replacement guidelines and required customer verification proofs?" },
                    { title: "Billing Discrepancy Flow", prompt: "Explain the standard procedure for investigating and correcting billing discrepancies." },
                  ].map((macro, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(macro.prompt)}
                      className="w-full text-left p-2.5 rounded-xl bg-muted/40 hover:bg-primary/10 border border-border/60 hover:border-primary/30 text-[11px] transition-all group"
                    >
                      <div className="font-semibold text-foreground group-hover:text-primary transition-colors flex items-center justify-between">
                        <span>{macro.title}</span>
                        <ArrowRight size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-muted-foreground text-[10px] line-clamp-1 mt-0.5">{macro.prompt}</p>
                    </button>
                  ))}
                </div>
              )}

              {/* TAB 2: LIVE RAG SOURCES & CITATIONS */}
              {sidebarTab === "sources" && (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                    <BookOpen size={12} />
                    Active Knowledge Grounding
                  </div>
                  
                  {streamingCitations.length > 0 ? (
                    streamingCitations.map((c, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1">
                        <div className="font-semibold text-foreground truncate flex items-center gap-1.5">
                          <FileText size={12} className="text-indigo-400" />
                          <span>{c.documentName || c.title || `Document #${i + 1}`}</span>
                        </div>
                        {c.text && (
                          <p className="text-muted-foreground text-[10px] line-clamp-2 italic leading-relaxed">
                            "{c.text}"
                          </p>
                        )}
                        <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 font-mono">
                          <span>Relevance: {c.score ? `${Math.round(c.score * 100)}%` : "High"}</span>
                          {c.page && <span>Page {c.page}</span>}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl border border-dashed text-center text-muted-foreground space-y-1">
                      <FileText size={16} className="mx-auto opacity-50 mb-1" />
                      <p className="font-medium text-[11px]">RAG Vector Search Active</p>
                      <p className="text-[10px] text-muted-foreground/80">Ask a question to see retrieved document chunks & citations live.</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: VERIFIED ENTERPRISE FAQS */}
              {sidebarTab === "faqs" && (
                <div className="space-y-2.5">
                  <div className="text-[10px] font-bold text-primary uppercase flex items-center gap-1">
                    <HelpCircle size={12} />
                    Top Verified FAQs
                  </div>
                  {topFaqs.length > 0 ? (
                    topFaqs.map((faq) => (
                      <div key={faq._id} className="p-2.5 rounded-xl bg-muted/40 border border-border/60 space-y-1.5">
                        <div className="font-semibold text-foreground text-[11px] leading-snug">
                          {faq.question}
                        </div>
                        <p className="text-muted-foreground text-[10px] line-clamp-2 leading-relaxed">
                          {faq.answer}
                        </p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-semibold">
                            {faq.category || "General"}
                          </span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(faq.answer);
                              setCopiedFaqId(faq._id);
                              toast.success("Copied", "FAQ answer copied to clipboard.");
                              setTimeout(() => setCopiedFaqId(null), 2000);
                            }}
                            className="px-2 py-1 rounded bg-secondary hover:bg-secondary/80 text-[10px] font-medium text-foreground flex items-center gap-1 transition"
                          >
                            {copiedFaqId === faq._id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                            <span>{copiedFaqId === faq._id ? "Copied" : "Copy"}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-[10px] text-muted-foreground text-center py-4">No verified FAQs found.</p>
                  )}
                </div>
              )}

            </div>
          )}
        </div>

        <div className="border-t bg-background/80 backdrop-blur-xl shrink-0">
          {activeChat && messages.length > 0 && (
            <div className="px-4 py-2 border-b flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleEndChat}
                  disabled={activeChat.status === "closed"}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20 disabled:opacity-50 transition-colors"
                >
                  <XCircle size={14} aria-hidden="true" />
                  End Chat
                </button>
              </div>

              <button
                onClick={async () => {
                  try {
                    const { AxiosInstance } = await import("@/api/axiosInstance");
                    const res = await AxiosInstance.post("/tickets/convert-from-chat", {
                      chatId: activeChat._id,
                      subject: `Support Ticket: ${activeChat.topic || "Chat Escalation"}`,
                      category: "question",
                      priority: "medium",
                    });
                    if (res.data.success) {
                      toast.success("Ticket Created", `Ticket #${res.data.data.ticket_number || res.data.data._id} created successfully!`);
                      window.location.href = `/support/tickets/${res.data.data._id}`;
                    }
                  } catch (err: any) {
                    toast.error("Error", err.response?.data?.message || err.message || "Failed to convert chat into a ticket.");
                  }
                }}
                disabled={activeChat.status === "CONVERTED_TO_TICKET"}
                className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-all shadow-sm active:scale-95"
              >
                <Ticket size={14} aria-hidden="true" />
                {activeChat.status === "CONVERTED_TO_TICKET" ? "Converted to Ticket" : "Convert to Ticket"}
              </button>
            </div>
          )}
          <ChatInput
            onSend={(text) => {
              if (!activeChat?._id) {
                handleStartWithMessage(text);
              } else {
                handleSend(text);
              }
            }}
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
