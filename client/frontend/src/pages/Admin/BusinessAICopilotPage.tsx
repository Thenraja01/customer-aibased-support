import { useState, useEffect, useRef } from "react";
import { useAuthContext } from "@/context/AuthContext";
import { ChatAPI } from "@/api";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  AlertCircle, 
  ShieldAlert, 
  Database,
  ShieldCheck,
  Network,
  Building2,
  User,
  Bot
} from "lucide-react";
import { useToast } from "@/components/ui/toast";

const OLLAMA_MODELS = [
  { id: "llama3.2:3b", name: "Llama 3.2 3B", purpose: "Fast" },
  { id: "qwen2.5:7b", name: "Qwen 2.5 7B", purpose: "Balanced" },
  { id: "llama3.1:8b", name: "Llama 3.1 8B", purpose: "Quality" }
];

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  status?: "pending" | "success" | "error" | "planning";
  toolCalls?: Array<{ name: string; status: "running" | "completed" | "failed" }>;
  pendingAction?: {
    action: string;
    payload: any;
    preview: {
      message: string;
      details?: any;
    };
  };
  structuredData?: any;
  errorDetail?: {
    code: string;
    message: string;
  };
}

type CopilotScope = "platform" | "organization" | "branch";

function getScopeForRole(role: string | null): CopilotScope {
  const normalized = (role || "").toLowerCase().replace(/[\s_]+/g, "_");
  if (normalized === "super_admin") return "platform";
  if (normalized === "admin") return "organization";
  if (normalized === "branch_admin") return "branch";
  return "branch";
}

const SCOPE_META: Record<CopilotScope, { label: string; badge: string; icon: any; description: string }> = {
  platform: {
    label: "Platform (Application) Scope",
    badge: "SUPER ADMIN",
    icon: ShieldCheck,
    description: "Full platform-wide access — all organizations, branches, users, audit logs, and platform settings.",
  },
  organization: {
    label: "Organization Scope",
    badge: "ORG ADMIN",
    icon: Building2,
    description: "Organization-wide access — all branches, users, tickets, documents, FAQs, and notifications within your organization.",
  },
  branch: {
    label: "Branch Scope",
    badge: "BRANCH ADMIN",
    icon: Network,
    description: "Branch-scoped access — data isolated strictly to your assigned branch.",
  },
};

const SAMPLE_PROMPTS: Record<CopilotScope, Array<{ label: string; prompt: string }>> = {
  platform: [
    { label: "Platform stats", prompt: "Show platform statistics" },
    { label: "List all organizations", prompt: "List all organizations" },
    { label: "Recent audit logs", prompt: "Show recent audit logs" },
    { label: "Platform users", prompt: "How many users are active across the platform?" },
    { label: "Pending items", prompt: "Show pending items" },
  ],
  organization: [
    { label: "Org tickets", prompt: "How many pending tickets are there?" },
    { label: "Org reports", prompt: "Show me the organization reports" },
    { label: "Pending docs", prompt: "How many documents are pending?" },
    { label: "Send notification", prompt: "Send a notification to active users saying the office will close at 5 PM today." },
    { label: "Active users", prompt: "How many users are active?" },
  ],
  branch: [
    { label: "Branch tickets", prompt: "Show unresolved tickets in my branch" },
    { label: "Branch documents", prompt: "How many documents are pending in my branch?" },
    { label: "Branch users", prompt: "How many support users are active in my branch?" },
    { label: "Send branch notification", prompt: "Send a notification to my branch users about scheduled maintenance." },
    { label: "Branch FAQ", prompt: "Show FAQs in my branch" },
  ],
};

export default function BusinessAICopilotPage() {
  const { user } = useAuthContext();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedModel, setSelectedModel] = useState(OLLAMA_MODELS[1].id); // Balanced by default
  const [isSending, setIsSending] = useState(false);
  const [currentToolStatus, setCurrentToolStatus] = useState<string | null>(null);

  const roleName = user?.roleName || user?.role || null;
  const scope: CopilotScope = getScopeForRole(roleName);
  const scopeMeta = SCOPE_META[scope];
  const samplePrompts = SAMPLE_PROMPTS[scope];

  const userOrgId =
    typeof user?.organization_id === "object"
      ? user?.organization_id?._id || user?.organization_id?.id
      : user?.organization_id || user?.organizationId;

  const getChatTopic = () => {
    if (scope === "platform") return "Super Admin Copilot (Platform)";
    if (scope === "organization") return "Organization Copilot Session";
    return "Branch Admin Copilot Session";
  };

  // Initialize or fetch a Business AI chat session on mount
  useEffect(() => {
    const initChat = async () => {
      if (!user?._id) return;
      try {
        const res = await ChatAPI.create({
          user_id: user._id,
          organization_id: userOrgId || null,
          topic: getChatTopic(),
          is_copilot: true
        });
        if (res.data?.success && res.data?.data?._id) {
          setChatId(res.data.data._id);
        }
      } catch (err) {
        console.error("Failed to initialize copilot chat session on mount:", err);
      }
    };
    initChat();
  }, [user?._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, currentToolStatus]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;

    if (!user?._id) {
      toast.error("Authentication Error", "You must be logged in to use Admin Copilot.");
      return;
    }

    setIsSending(true);
    let activeChatId = chatId;

    // Dynamically create or retry chat session if missing
    if (!activeChatId) {
      setCurrentToolStatus("Initializing copilot session...");
      try {
        const res = await ChatAPI.create({
          user_id: user._id,
          organization_id: userOrgId || null,
          topic: getChatTopic(),
          is_copilot: true
        });
        if (res.data?.success && res.data?.data?._id) {
          activeChatId = res.data.data._id;
          setChatId(activeChatId);
        } else {
          throw new Error("Unable to create chat session.");
        }
      } catch (err) {
        toast.error("Session Error", "Could not verify your admin session. Please log in again.");
        setIsSending(false);
        setCurrentToolStatus(null);
        return;
      }
    }

    const userMsgId = Date.now().toString();
    const newUserMsg: Message = {
      id: userMsgId,
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInputValue("");
    setCurrentToolStatus("AI routing query...");

    const assistantMsgId = (Date.now() + 1).toString();
    
    try {
      const res = await ChatAPI.sendAI(activeChatId!, text, selectedModel, null);
      
      if (res.data?.success) {
        const responseData = res.data.data;
        const newAssistantMsg: Message = {
          id: assistantMsgId,
          role: "assistant",
          content: responseData.text || responseData.content || "Action executed successfully.",
          timestamp: new Date(),
          status: responseData.success === false ? "error" : "success",
          toolCalls: responseData.toolCalls || [],
          pendingAction: responseData.pendingAction || null,
          structuredData: responseData.structuredData || null,
          errorDetail: responseData.error || null
        };
        setMessages((prev) => [...prev, newAssistantMsg]);
      } else {
        throw new Error(res.data?.message || "Failed to generate AI response.");
      }
    } catch (err: any) {
      console.error(err);
      const errMsg: Message = {
        id: assistantMsgId,
        role: "assistant",
        content: "An error occurred while processing your request.",
        timestamp: new Date(),
        status: "error",
        errorDetail: {
          code: "INTERNAL_ERROR",
          message: err.message || "Something went wrong on the server."
        }
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
      setCurrentToolStatus(null);
    }
  };

  const handleActionConfirm = async (messageId: string, pendingAction: any, confirmed: boolean) => {
    if (!chatId || isSending) return;

    setIsSending(true);
    setCurrentToolStatus(confirmed ? "Executing requested changes..." : "Cancelling action...");

    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === messageId) {
          return {
            ...msg,
            pendingAction: undefined,
            content: msg.content + `\n\n*(Action ${confirmed ? "Confirmed" : "Cancelled"} by user)*`
          };
        }
        return msg;
      })
    );

    try {
      const confirmationPayload = {
        action: pendingAction.action,
        payload: pendingAction.payload,
        confirmed
      };

      const res = await ChatAPI.sendAI(chatId, confirmed ? "Proceed with action" : "Cancel action", selectedModel, confirmationPayload);

      if (res.data?.success) {
        const responseData = res.data.data;
        const resultMsg: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: responseData.text || responseData.content || "Confirmation received.",
          timestamp: new Date(),
          status: responseData.success === false ? "error" : "success",
          toolCalls: responseData.toolCalls || [],
          structuredData: responseData.structuredData || null,
          errorDetail: responseData.error || null
        };
        setMessages((prev) => [...prev, resultMsg]);
      } else {
        throw new Error(res.data?.message || "Execution failed.");
      }
    } catch (err: any) {
      toast.error("Error", err.message || "Failed to execute confirmation.");
      const errMsg: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content: "Failed to finalize the business action.",
        timestamp: new Date(),
        status: "error",
        errorDetail: {
          code: "CONFIRMATION_FAILED",
          message: err.message
        }
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsSending(false);
      setCurrentToolStatus(null);
    }
  };

  const renderStructuredData = (data: any) => {
    if (!data) return null;
    
    if (typeof data.count === "number" && Object.keys(data).length === 1) {
      return (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 my-2 flex items-center gap-3">
          <Database className="text-primary" size={20} />
          <div>
            <span className="text-xs text-muted-foreground font-semibold uppercase  block">Total Items Found</span>
            <span className="text-2xl font-bold">{data.count}</span>
          </div>
        </div>
      );
    }

    if (Array.isArray(data.items) && data.items.length > 0) {
      const headers = Object.keys(data.items[0]).filter(key => key !== "_id" && key !== "__v");
      return (
        <div className="overflow-x-auto border border-white/10 dark:border-white/5 rounded-xl my-3">
          <table className="min-w-full divide-y divide-white/10 dark:divide-white/5 text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground text-xs uppercase font-semibold">
              <tr>
                {headers.map(h => (
                  <th key={h} className="px-4 py-2.5">{h.replace("_", " ")}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10 dark:divide-white/5">
              {data.items.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-muted/20 transition-colors">
                  {headers.map(h => (
                    <td key={h} className="px-4 py-2.5 max-w-[200px] truncate">
                      {typeof item[h] === "object" ? JSON.stringify(item[h]) : String(item[h])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return (
      <pre className="bg-muted/50 border border-white/10 dark:border-white/5 rounded-lg p-3 text-xs overflow-x-auto text-foreground/80 font-mono my-2 max-h-48">
        {JSON.stringify(data, null, 2)}
      </pre>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] relative overflow-hidden bg-background">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-white/10 dark:border-white/5 mb-4 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold  flex items-center gap-2 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
            <Sparkles className="text-primary animate-pulse" size={28} />
            Business AI Copilot
          </h1>
          <p className="text-muted-foreground text-sm">
            Live database querying, workflow actions, and admin operations under server-side RBAC protection.
          </p>
          <div className="mt-2 inline-flex items-center gap-2 bg-muted/40 border border-primary/20 rounded-full pl-2 pr-3 py-1 text-xs">
            {(() => {
              const ScopeIcon = scopeMeta.icon;
              return <ScopeIcon size={14} className="text-primary" />;
            })()}
            <span className="font-semibold text-foreground/80">{scopeMeta.label}</span>
            <span className="bg-primary/15 text-primary font-bold text-[10px] uppercase px-2 py-0.5 rounded-full">{scopeMeta.badge}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-muted/40 p-1.5 rounded-xl border border-white/5">
          <span className="text-xs font-semibold text-muted-foreground pl-2.5 uppercase ">Model:</span>
          <select 
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="bg-card text-foreground border border-white/10 rounded-lg text-sm px-3 py-1.5 font-medium outline-none focus:border-primary transition-all cursor-pointer"
          >
            {OLLAMA_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.purpose})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-4 sidebar-scrollbar mb-4">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-white/5 rounded-2xl bg-muted/10">
            <Bot size={48} className="text-primary/70 animate-bounce mb-3" />
            <h3 className="text-lg font-bold text-foreground/80">Start a Copilot Session</h3>
            <p className="text-muted-foreground text-sm max-w-md mt-1">
              {scopeMeta.description}
            </p>
            <p className="text-xs text-muted-foreground/80 max-w-md mt-1">
              Query live data, manage resources, and dispatch notifications — every action is scoped,
              verified, and confirmed before it executes.
            </p>
            <div className="flex flex-wrap gap-2 mt-4 justify-center max-w-lg">
              {samplePrompts.map((sample) => (
                <button 
                  key={sample.label}
                  onClick={() => handleSend(sample.prompt)}
                  className="bg-card border border-white/10 hover:border-primary/50 text-xs font-medium py-1.5 px-3 rounded-lg transition-all"
                >
                  "{sample.label}"
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 max-w-[85%] ${msg.role === "user" ? "ml-auto flex-row-reverse" : "mr-auto"}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
              msg.role === "user" ? "bg-primary" : "bg-muted-foreground/30"
            }`}>
              {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className={`p-4 rounded-2xl shadow-sm border ${
                msg.role === "user" 
                  ? "bg-primary/10 border-primary/20 text-foreground" 
                  : msg.status === "error" 
                    ? "bg-destructive/10 border-destructive/20 text-foreground"
                    : "bg-card border-white/10 text-foreground"
              }`}>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                {renderStructuredData(msg.structuredData)}

                {msg.toolCalls && msg.toolCalls.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-white/15 dark:border-white/5 flex flex-wrap gap-2">
                    {msg.toolCalls.map((tc, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1.5 text-xs bg-muted/80 text-muted-foreground px-2 py-1 rounded-md border border-white/5">
                        <Database size={12} className="text-primary" />
                        {tc.name}
                        {tc.status === "completed" && <CheckCircle size={12} className="text-green-500" />}
                        {tc.status === "running" && <Loader2 size={12} className="text-amber-500 animate-spin" />}
                        {tc.status === "failed" && <AlertCircle size={12} className="text-red-500" />}
                      </span>
                    ))}
                  </div>
                )}

                {msg.status === "error" && msg.errorDetail && (
                  <div className="mt-3 p-3 bg-destructive/15 border border-destructive/30 rounded-lg flex gap-2.5 items-start text-xs text-red-600 dark:text-red-400">
                    <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block uppercase  text-[10px]">Permission or System Error ({msg.errorDetail.code})</span>
                      <span>{msg.errorDetail.message}</span>
                    </div>
                  </div>
                )}

                {msg.pendingAction && (
                  <div className="mt-4 p-4 border border-amber-500/30 bg-amber-500/10 rounded-xl space-y-3">
                    <div className="flex gap-2 items-center text-amber-600 dark:text-amber-400">
                      <AlertTriangle size={18} />
                      <span className="font-bold text-sm">Action Approval Required</span>
                    </div>
                    <p className="text-xs text-foreground/80">{msg.pendingAction.preview.message}</p>
                    <div className="flex gap-2 pt-1.5">
                      <button 
                        onClick={() => handleActionConfirm(msg.id, msg.pendingAction, true)}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs py-1.5 px-4 rounded-lg shadow-sm transition-all"
                      >
                        Confirm Action
                      </button>
                      <button 
                        onClick={() => handleActionConfirm(msg.id, msg.pendingAction, false)}
                        className="bg-card hover:bg-muted border border-white/10 font-semibold text-xs py-1.5 px-4 rounded-lg transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground self-start pl-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}

        {isSending && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="w-8 h-8 rounded-full bg-muted-foreground/30 flex items-center justify-center text-white">
              <Bot size={16} />
            </div>
            <div className="bg-card border border-white/10 p-4 rounded-2xl shadow-sm text-sm text-muted-foreground flex items-center gap-3">
              <Loader2 size={16} className="animate-spin text-primary" />
              <span>{currentToolStatus || "AI is processing..."}</span>
            </div>
          </div>
        )}
      </div>

      <form 
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(inputValue);
        }}
        className="flex gap-2 p-3 bg-card border border-white/10 rounded-2xl shadow-inner items-center relative z-10"
      >
        <input 
          type="text" 
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={scope === "platform"
            ? "Ask copilot, manage platform data, dispatch notification..."
            : "Ask copilot, manage organization data, dispatch notification..."}
          className="flex-1 bg-transparent px-3 py-2 text-sm outline-none text-foreground placeholder:text-muted-foreground/75"
          disabled={isSending}
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || isSending}
          className="w-10 h-10 bg-primary hover:bg-primary/95 text-white disabled:opacity-50 rounded-xl flex items-center justify-center transition-all shadow"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
