import { useEffect, useState, useRef } from "react";
import {
  Sparkles, Send, Square, ThumbsUp, ThumbsDown, Copy, Bot, ChevronDown, Check, Menu, MessageSquare, FileText, BookOpen
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { getTokenFromStorage } from "@/utils/localStorage";
import { AIWorkspaceAPI, AIConversationItem, AIMessageItemData, AISourceItem } from "@/api/ai.api";
import { AISidebar } from "@/components/ai/AISidebar";
import { AISourceViewerModal } from "@/components/ai/AISourceViewerModal";
import { cn } from "@/lib/utils";

type AIMode = "ask_ai" | "knowledge" | "documents";

const MODE_LABELS: Record<AIMode, { label: string; icon: any; roles: string[] }> = {
  ask_ai: { label: "Document AI (RAG)", icon: Sparkles, roles: ["all"] },
  knowledge: { label: "Knowledge Base", icon: BookOpen, roles: ["all"] },
  documents: { label: "Uploaded Documents", icon: FileText, roles: ["all"] },
};

const MODEL_OPTIONS = [
  { value: "gemini", label: "Google Gemini 2.5 Flash", provider: "gemini", model: "gemini-2.5-flash" },
  { value: "gemini-pro", label: "Google Gemini 1.5 Pro", provider: "gemini", model: "gemini-1.5-pro" },
  { value: "groq", label: "Groq Llama 3.3 (70B)", provider: "groq", model: "llama-3.3-70b-versatile" },
  { value: "ollama", label: "Ollama Llama 3.2 (Local)", provider: "ollama", model: "llama3.2:3b" },
  { value: "claude", label: "Claude 3.5 Sonnet", provider: "claude", model: "claude-3-5-sonnet-20241022" },
];

const SAMPLE_SUGGESTIONS = [
  "What are our standard SLA response policies in uploaded documents?",
  "Summarize escalation steps from the knowledge base documentation",
  "Search uploaded files for system configuration and troubleshooting steps",
];

export default function AIWorkspacePage() {
  const { user } = useAuth();
  const toast = useToast();
  const roleName = user?.roleName || user?.role || "customer";

  const [conversations, setConversations] = useState<AIConversationItem[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessageItemData[]>([]);
  const [inputPrompt, setInputPrompt] = useState("");
  const [mode, setMode] = useState<AIMode>("ask_ai");
  const [selectedModelKey, setSelectedModelKey] = useState("gemini");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [streamingSources, setStreamingSources] = useState<AISourceItem[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedSource, setSelectedSource] = useState<AISourceItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeModelObj = MODEL_OPTIONS.find((m) => m.value === selectedModelKey) || MODEL_OPTIONS[0];

  const loadConversations = async () => {
    try {
      const data = await AIWorkspaceAPI.getConversations();
      setConversations(data);
      if (data.length > 0 && !activeConvId) {
        setActiveConvId(data[0]._id);
      }
    } catch {
      // silent
    }
  };

  const loadMessages = async (convId: string) => {
    try {
      const data = await AIWorkspaceAPI.getMessages(convId);
      setMessages(data);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    if (activeConvId) {
      loadMessages(activeConvId);
    }
  }, [activeConvId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleNewConversation = async () => {
    try {
      const conv = await AIWorkspaceAPI.createConversation({
        title: "Document RAG Session",
        mode,
        model: activeModelObj.model,
      });
      setConversations((prev: AIConversationItem[]) => [conv, ...prev]);
      setActiveConvId(conv._id);
      setMessages([]);
    } catch {
      toast.error("Failed to create new conversation");
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const prompt = textToSend || inputPrompt;
    if (!prompt.trim() || isStreaming) return;

    setInputPrompt("");
    setIsStreaming(true);
    setStreamingText("");
    setStreamingSources([]);

    // Optimistically add User Message
    const tempUserMsg: AIMessageItemData = {
      _id: `temp-${Date.now()}`,
      conversation_id: activeConvId || "",
      role: "user",
      content: prompt,
      created_at: new Date().toISOString(),
    };
    setMessages((prev: AIMessageItemData[]) => [...prev, tempUserMsg]);

    try {
      const rawUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3030";
      const backendUrl = rawUrl.replace(/\/+$/, "");
      const token = getTokenFromStorage();
      const response = await fetch(`${backendUrl}/api/ai/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
          conversation_id: activeConvId,
          chatId: activeConvId,
          message: prompt,
          mode,
          provider: activeModelObj.provider,
          model: activeModelObj.model,
        }),
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.conversation_id && !activeConvId) {
                setActiveConvId(data.conversation_id);
              }
              if (data.content) {
                accumulated += data.content;
                setStreamingText(accumulated);
              }
              if (data.title) {
                setStreamingSources((prev: AISourceItem[]) => {
                  if (prev.some((s) => s.title === data.title)) return prev;
                  return [...prev, data];
                });
              }
            } catch {
              // silent parsing error
            }
          }
        }
      }

      await loadConversations();
      if (activeConvId) await loadMessages(activeConvId);
    } catch {
      toast.error("Error generating Document AI response");
    } finally {
      setIsStreaming(false);
      setStreamingText("");
    }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = async (messageId: string, type: "thumbs_up" | "thumbs_down") => {
    try {
      await AIWorkspaceAPI.setFeedback(messageId, type);
      setMessages((prev: AIMessageItemData[]) =>
        prev.map((m: AIMessageItemData) => (m._id === messageId ? { ...m, feedback: type } : m))
      );
      toast.success("Feedback recorded!");
    } catch {
      // silent
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <AISidebar
        conversations={conversations}
        activeConversationId={activeConvId}
        onSelectConversation={setActiveConvId}
        onNewConversation={handleNewConversation}
        onUpdateConversation={async (id, updates) => {
          await AIWorkspaceAPI.updateConversation(id, updates);
          loadConversations();
        }}
        onDeleteConversation={async (id) => {
          await AIWorkspaceAPI.deleteConversation(id);
          if (activeConvId === id) setActiveConvId(null);
          loadConversations();
        }}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 bg-background">
        {/* Top Navbar Header */}
        <header className="h-14 border-b border-border bg-card/60 backdrop-blur-md px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-xl hover:bg-muted transition"
            >
              <Menu size={18} />
            </button>

            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-primary" />
              <h1 className="text-sm font-bold text-foreground">Document-Based AI Support</h1>
            </div>
          </div>

          {/* Mode & Model Controls */}
          <div className="flex items-center gap-2">
            {/* Mode Selector */}
            <div className="relative">
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as AIMode)}
                className="appearance-none bg-card border border-border rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-foreground focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                {(Object.keys(MODE_LABELS) as AIMode[]).map((mKey) => (
                  <option key={mKey} value={mKey}>
                    {MODE_LABELS[mKey].label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-muted-foreground pointer-events-none" />
            </div>

            {/* Model Selector */}
            <div className="relative">
              <select
                value={selectedModelKey}
                onChange={(e) => setSelectedModelKey(e.target.value)}
                className="appearance-none bg-card border border-border rounded-xl px-3 py-1.5 pr-8 text-xs font-semibold text-primary focus:outline-none focus:border-primary/50 cursor-pointer"
              >
                {MODEL_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-2.5 text-primary pointer-events-none" />
            </div>
          </div>
        </header>

        {/* Conversation Stream & Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
          {messages.length === 0 && !isStreaming ? (
            /* Empty State / Suggestions */
            <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center mx-auto shadow-xl shadow-primary/10">
                <Sparkles size={32} />
              </div>
              <div>
                <h2 className="text-xl font-extrabold text-foreground">Document-Grounded RAG AI</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Ask questions to get accurate answers synthesized directly from your organization's uploaded documentation.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-4">
                {SAMPLE_SUGGESTIONS.map((promptText, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSendMessage(promptText)}
                    className="p-3.5 rounded-2xl border border-border bg-card hover:bg-muted/60 hover:border-primary/40 transition text-xs space-y-2 group shadow-sm"
                  >
                    <Sparkles size={14} className="text-primary group-hover:scale-110 transition-transform" />
                    <p className="text-foreground font-medium leading-relaxed">{promptText}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* Messages List */
            <div className="max-w-3xl mx-auto space-y-6">
              {messages.map((msg: AIMessageItemData) => (
                <div
                  key={msg._id}
                  className={cn(
                    "flex gap-3 text-xs leading-relaxed",
                    msg.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role !== "user" && (
                    <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Bot size={16} />
                    </div>
                  )}

                  <div
                    className={cn(
                      "rounded-2xl p-4 space-y-3 max-w-[85%]",
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                        : "bg-card border border-border text-foreground shadow-sm"
                    )}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>

                    {/* Sources Cards */}
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="pt-2 border-t border-border space-y-1.5">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                          Document Sources
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src: AISourceItem) => (
                            <button
                              key={src.id || src.title}
                              onClick={() => setSelectedSource(src)}
                              className="px-2.5 py-1 rounded-xl bg-background border border-border hover:border-primary/50 text-[11px] text-primary flex items-center gap-1.5 transition"
                            >
                              <FileText size={12} /> {src.title} {src.relevance ? `(${src.relevance}%)` : ""}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Message Actions */}
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 pt-1 text-muted-foreground">
                        <button
                          onClick={() => handleCopyText(msg._id, msg.content)}
                          className="hover:text-foreground transition"
                          title="Copy text"
                        >
                          {copiedId === msg._id ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                        </button>
                        <button
                          onClick={() => handleFeedback(msg._id, "thumbs_up")}
                          className={cn("hover:text-success transition", msg.feedback === "thumbs_up" && "text-success")}
                          title="Helpful"
                        >
                          <ThumbsUp size={13} />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg._id, "thumbs_down")}
                          className={cn("hover:text-rose-500 transition", msg.feedback === "thumbs_down" && "text-rose-500")}
                          title="Not helpful"
                        >
                          <ThumbsDown size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Streaming Output */}
              {isStreaming && (
                <div className="flex gap-3 text-xs leading-relaxed justify-start">
                  <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/30 text-primary flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                    <Bot size={16} />
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-4 space-y-3 max-w-[85%] text-foreground">
                    {streamingSources.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pb-2 border-b border-border">
                        {streamingSources.map((s: AISourceItem, idx: number) => (
                          <span key={idx} className="px-2 py-0.5 rounded-lg bg-primary/10 border border-primary/30 text-primary text-[10px]">
                            📄 {s.title}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{streamingText || "Searching documents & generating answer..."}</div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Bottom Input Composer */}
        <div className="p-4 border-t border-border bg-card/60 backdrop-blur-md shrink-0">
          <div className="max-w-3xl mx-auto">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="relative bg-background border border-border rounded-2xl p-2 focus-within:border-primary/50 shadow-md transition"
            >
              <textarea
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask any question about your organization's documents... (Press Enter to send)"
                rows={2}
                className="w-full bg-transparent border-none text-xs text-foreground placeholder:text-muted-foreground focus:outline-none resize-none px-2 py-1"
              />

              <div className="flex items-center justify-between pt-1 border-t border-border/50">
                <span className="text-[10px] text-muted-foreground px-2">
                  Role: <strong className="text-foreground capitalize">{roleName}</strong> | Model: <strong className="text-primary">{activeModelObj.label}</strong>
                </span>

                <div className="flex items-center gap-2">
                  {isStreaming ? (
                    <button
                      type="button"
                      onClick={() => setIsStreaming(false)}
                      className="p-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Square size={12} /> Stop
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={!inputPrompt.trim()}
                      className="p-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl transition"
                    >
                      <Send size={14} />
                    </button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Source Viewer Modal */}
      <AISourceViewerModal source={selectedSource} onClose={() => setSelectedSource(null)} />
    </div>
  );
}
