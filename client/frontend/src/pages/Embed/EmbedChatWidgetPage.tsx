import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Send,
  Paperclip,
  Sparkles,
  Bot,
  User,
  RotateCcw,
  ExternalLink,
  Zap,
  AlertCircle,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface MessageCitation {
  documentId?: string;
  documentName?: string;
  title?: string;
  score?: number;
  preview?: string;
}

interface ChatMessageItem {
  id: string;
  text: string;
  isUser: boolean;
  isThinking?: boolean;
  citations?: MessageCitation[];
  timestamp?: string;
}

export default function EmbedChatWidgetPage() {
  const [searchParams] = useSearchParams();
  const apiKey = searchParams.get("key") || searchParams.get("apiKey") || "";
  const customBranchId = searchParams.get("branchId") || "";
  const customUserId = searchParams.get("userId") || "";
  const themeParam = searchParams.get("theme") || "dark";

  const [botName, setBotName] = useState("Support AI");
  const [greeting, setGreeting] = useState("Hello! How can I assist you today?");
  const [accentColor, setAccentColor] = useState("#6366f1");
  const [features, setFeatures] = useState({ fileUploads: true, liveAgentHandoff: true });
  const [sessionId, setSessionId] = useState<string>(() => {
    return localStorage.getItem(`__support_ai_embed_session_${apiKey}`) || "";
  });

  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const [expandedCitations, setExpandedCitations] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3030";

  // Auto-scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initial Handshake (/api/v1/widget/init)
  useEffect(() => {
    if (!apiKey) return;

    fetch(`${backendUrl}/api/v1/widget/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "x-user-id": customUserId,
        "x-branch-id": customBranchId,
      },
      body: JSON.stringify({
        sessionId,
        userId: customUserId,
        branchId: customBranchId,
        clientTimestamp: Date.now(),
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          if (data.botName) setBotName(data.botName);
          if (data.greeting) {
            setGreeting(data.greeting);
            setMessages((prev) => {
              if (prev.length === 0) {
                return [
                  {
                    id: "greeting",
                    text: data.greeting,
                    isUser: false,
                    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  },
                ];
              }
              return prev;
            });
          }
          if (data.accentColor) setAccentColor(data.accentColor);
          if (data.features) setFeatures(data.features);
          if (data.sessionId && !sessionId) {
            setSessionId(data.sessionId);
            localStorage.setItem(`__support_ai_embed_session_${apiKey}`, data.sessionId);
          }
        }
      })
      .catch((err) => console.warn("[EmbedWidget] Handshake error:", err));
  }, [apiKey, backendUrl, customBranchId, customUserId, sessionId]);

  // Reset conversation
  const handleReset = () => {
    const newSession = "session_" + Math.random().toString(36).substring(2, 9);
    setSessionId(newSession);
    localStorage.setItem(`__support_ai_embed_session_${apiKey}`, newSession);
    setIsEscalated(false);
    setMessages([
      {
        id: "greeting-" + Date.now(),
        text: greeting,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  // Request Live Agent Handoff
  const handleEscalate = async () => {
    if (isEscalated) return;
    setIsEscalated(true);
    setMessages((prev) => [
      ...prev,
      {
        id: "escalate-" + Date.now(),
        text: "⚡ Connecting to a human support agent... A representative has been notified.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    fetch(`${backendUrl}/api/v1/chat/escalate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({ apiKey, chatId: sessionId }),
    }).catch(() => null);
  };

  // Send Message with SSE Token Streaming
  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputText).trim();
    if (!query || loading) return;

    if (!textToSend) setInputText("");

    const userMsgId = "user-" + Date.now();
    const aiMsgId = "ai-" + Date.now();
    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      { id: userMsgId, text: query, isUser: true, timestamp: timeStr },
      { id: aiMsgId, text: "", isUser: false, isThinking: true, citations: [], timestamp: timeStr },
    ]);
    setLoading(true);

    try {
      const response = await fetch(`${backendUrl}/api/v1/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "x-user-id": customUserId,
          "x-branch-id": customBranchId,
        },
        body: JSON.stringify({
          sessionId,
          apiKey,
          userId: customUserId,
          branchId: customBranchId,
          prompt: query,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() || "";

        for (const chunk of chunks) {
          if (!chunk.trim()) continue;

          let eventType = "message";
          let dataText = "";

          const lines = chunk.split("\n");
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith("event:")) {
              eventType = trimmed.substring(6).trim();
            } else if (trimmed.startsWith("data:")) {
              dataText = trimmed.substring(5).trim();
            }
          }

          if (!dataText) continue;

          try {
            const payload = JSON.parse(dataText);

            if (eventType === "metadata" && payload.sources) {
              setMessages((prev) =>
                prev.map((m) => (m.id === aiMsgId ? { ...m, citations: payload.sources } : m))
              );
            } else if (eventType === "token" && payload.text !== undefined) {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, isThinking: false, text: (m.text || "") + payload.text }
                    : m
                )
              );
            } else if (eventType === "handoff") {
              setIsEscalated(true);
            }
          } catch {
            /* ignore parse errors */
          }
        }
      }
    } catch {
      // Fallback to standard HTTP endpoint
      try {
        const res = await fetch(`${backendUrl}/api/v1/chat/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "x-user-id": customUserId,
            "x-branch-id": customBranchId,
          },
          body: JSON.stringify({
            chatId: sessionId,
            apiKey,
            userId: customUserId,
            branchId: customBranchId,
            message: query,
          }),
        }).then((r) => r.json());

        if (res.success && res.data) {
          if (res.data.chatId && !sessionId) {
            setSessionId(res.data.chatId);
            localStorage.setItem(`__support_ai_embed_session_${apiKey}`, res.data.chatId);
          }
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    isThinking: false,
                    text: res.data.answer || "I am here to assist you.",
                    citations: res.data.citations || [],
                  }
                : m
            )
          );
        } else {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId
                ? {
                    ...m,
                    isThinking: false,
                    text: res.message || "Unable to retrieve response. Please try again.",
                  }
                : m
            )
          );
        }
      } catch {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === aiMsgId
              ? {
                  ...m,
                  isThinking: false,
                  text: "Unable to connect to the AI support server. Please check your network.",
                }
              : m
          )
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle Attachment Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !apiKey) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("sessionId", sessionId);
    formData.append("apiKey", apiKey);

    const uploadMsgId = "upload-" + Date.now();
    setMessages((prev) => [
      ...prev,
      {
        id: uploadMsgId,
        text: `📎 Uploading ${file.name}...`,
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    try {
      const res = await fetch(`${backendUrl}/api/v1/chat/upload`, {
        method: "POST",
        headers: { "x-api-key": apiKey },
        body: formData,
      }).then((r) => r.json());

      if (res.success && res.data?.answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: "ai-" + Date.now(),
            text: res.data.answer,
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: "err-" + Date.now(),
          text: "Failed to upload document attachment.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  };

  const isDark = themeParam !== "light";

  return (
    <div
      className={`h-screen w-screen flex flex-col font-sans overflow-hidden select-text ${
        isDark ? "dark bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"
      }`}
    >
      {/* ── Widget Header ────────────────────────────────────────── */}
      <header
        className={`px-4 py-3.5 flex items-center justify-between border-b shrink-0 backdrop-blur-md ${
          isDark
            ? "bg-slate-900/90 border-slate-800/90"
            : "bg-white/90 border-slate-200"
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-white shadow-md"
            style={{ backgroundColor: accentColor }}
          >
            <Bot size={18} />
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-slate-900 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight flex items-center gap-1.5">
              <span>{botName}</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-500">
                Online
              </span>
            </h1>
            <p className="text-[11px] text-muted-foreground">Autonomous AI Assistant</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {features.liveAgentHandoff && (
            <button
              onClick={handleEscalate}
              disabled={isEscalated}
              title="Request Live Human Agent"
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 border transition-all ${
                isEscalated
                  ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
                  : "bg-amber-500/10 text-amber-500 border-amber-500/25 hover:bg-amber-500/20"
              }`}
            >
              <Zap size={12} />
              <span>{isEscalated ? "Agent Connected" : "Live Agent"}</span>
            </button>
          )}

          <button
            onClick={handleReset}
            title="Reset Conversation"
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </header>

      {/* ── Message Scroll Body ──────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto p-4 space-y-3.5 scroll-smooth">
        {!apiKey && (
          <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
            <AlertCircle size={15} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Missing API Key</p>
              <p className="opacity-90 mt-0.5">
                Pass a valid public key in the URL: <code>?key=pk_live_...</code>
              </p>
            </div>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.isUser ? "items-end" : "items-start"} animate-in fade-in-50 duration-200`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-[13px] leading-relaxed shadow-sm break-words ${
                m.isUser
                  ? "text-white rounded-br-sm"
                  : isDark
                  ? "bg-slate-900 border border-slate-800/90 text-slate-100 rounded-bl-sm"
                  : "bg-white border border-slate-200 text-slate-900 rounded-bl-sm"
              }`}
              style={m.isUser ? { backgroundColor: accentColor } : {}}
            >
              {/* Thinking State */}
              {!m.isUser && (m.isThinking || !m.text) ? (
                <div className="flex items-center gap-2 py-0.5">
                  <Sparkles size={13} className="text-indigo-400 animate-spin [animation-duration:3s]" />
                  <span className="font-medium text-muted-foreground bg-gradient-to-r from-muted-foreground via-indigo-300 to-muted-foreground bg-clip-text">
                    AI is thinking...
                  </span>
                  <div className="flex gap-1 items-center ml-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              ) : (
                <p className="whitespace-pre-line">{m.text}</p>
              )}

              {/* Citations & Verified Sources */}
              {!m.isUser && m.citations && m.citations.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-border/50 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                      <FileText size={10} />
                      <span>Sources ({m.citations.length})</span>
                    </span>
                    {m.citations.length > 1 && (
                      <button
                        onClick={() =>
                          setExpandedCitations((prev) => ({
                            ...prev,
                            [m.id]: !prev[m.id],
                          }))
                        }
                        className="text-[10px] text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                      >
                        <span>{expandedCitations[m.id] ? "Collapse" : "View all"}</span>
                        {expandedCitations[m.id] ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(expandedCitations[m.id] ? m.citations : m.citations.slice(0, 1)).map((c, idx) => (
                      <div
                        key={idx}
                        className="text-[11px] px-2 py-0.5 rounded-md bg-muted/60 border border-border/60 text-muted-foreground flex items-center gap-1 font-medium"
                      >
                        <FileText size={10} className="text-primary" />
                        <span className="truncate max-w-[200px]">
                          {c.title || c.documentName || "Knowledge Document"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {m.timestamp && (
              <span className="text-[10px] text-muted-foreground/60 px-1 mt-1 font-mono">
                {m.timestamp}
              </span>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </main>

      {/* ── Widget Input Footer ─────────────────────────────────── */}
      <footer
        className={`p-3 border-t shrink-0 ${
          isDark ? "bg-slate-900/90 border-slate-800/90" : "bg-white/90 border-slate-200"
        }`}
      >
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept=".pdf,.txt,.docx,.csv"
          />

          {features.fileUploads && (
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Attach document (.pdf, .txt, .docx)"
              className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              <Paperclip size={16} />
            </button>
          )}

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSendMessage()}
            placeholder="Ask anything about our documentation..."
            disabled={loading}
            className={`flex-1 text-xs sm:text-[13px] rounded-xl px-3.5 py-2 border outline-none transition-all ${
              isDark
                ? "bg-slate-950 border-slate-800 focus:border-indigo-500 text-slate-100"
                : "bg-slate-100 border-slate-200 focus:border-indigo-500 text-slate-900"
            }`}
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputText.trim()}
            className="p-2.5 rounded-xl text-white shadow-md disabled:opacity-40 transition-all flex items-center justify-center"
            style={{ backgroundColor: accentColor }}
          >
            <Send size={15} />
          </button>
        </div>

        <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground/60">
          <span>Powered by</span>
          <span className="font-semibold text-muted-foreground">SupportAI Autonomous Concierge</span>
        </div>
      </footer>
    </div>
  );
}
