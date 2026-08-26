import React, { useEffect, useState, useRef } from "react";
import {
  Sparkles,
  Bot,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Send,
  RefreshCw,
  Zap,
  BookOpen,
  ArrowRight,
  UserCheck,
  Tag,
  Check,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AxiosInstance from "@/api/axiosInstance";
import { useToast } from "@/components/ui/toast";
import { useSocket } from "@/context/SocketContext";

interface TicketAiIntelligencePanelProps {
  ticketId: string;
  messagesCount?: number;
  onUseResponse?: (text: string) => void;
  onEscalate?: () => void;
  onPriorityUpdated?: () => void;
}

export default function TicketAiIntelligencePanel({
  ticketId,
  messagesCount = 0,
  onUseResponse,
  onEscalate,
  onPriorityUpdated,
}: TicketAiIntelligencePanelProps) {
  const toast = useToast();
  const { socket } = useSocket();
  const [intel, setIntel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [applyingPriority, setApplyingPriority] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [copiedResponse, setCopiedResponse] = useState(false);

  const prevMsgCountRef = useRef(messagesCount);

  useEffect(() => {
    if (ticketId) fetchIntelligence();
  }, [ticketId]);

  // When new messages arrive in the active conversation, auto-refresh the intelligence
  useEffect(() => {
    if (messagesCount > 0 && messagesCount !== prevMsgCountRef.current) {
      prevMsgCountRef.current = messagesCount;
      fetchIntelligence();
    }
  }, [messagesCount]);

  // Socket listener for real-time AI generation progress and updates
  useEffect(() => {
    if (!socket || !ticketId) return;

    socket.emit("ticket:join", ticketId);

    const handleAiProgress = (data: any) => {
      if (data?.ticketId === ticketId || !data?.ticketId) {
        if (data?.stage === "AI_COMPLETED" && data?.intelligence) {
          setIntel(data.intelligence);
          setAnalyzing(false);
        }
      }
    };

    const handleNewMessage = () => {
      // Refresh intelligence after message received
      setTimeout(() => {
        fetchIntelligence();
      }, 1000);
    };

    socket.on("ticket_ai_progress", handleAiProgress);
    socket.on("ticket:new-message", handleNewMessage);

    return () => {
      socket.off("ticket_ai_progress", handleAiProgress);
      socket.off("ticket:new-message", handleNewMessage);
    };
  }, [socket, ticketId]);

  const fetchIntelligence = async () => {
    setLoading(true);
    try {
      const res = await AxiosInstance.get(`/tickets/${ticketId}/ai-intelligence`);
      if (res.data?.success) {
        setIntel(res.data.data);
      }
    } catch {
      /* ignore fetch error */
    } finally {
      setLoading(false);
    }
  };

  const triggerReAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await AxiosInstance.post(`/tickets/${ticketId}/ai-analyze`);
      if (res.data?.success) {
        setIntel(res.data.data);
        toast.success("AI Regenerated", "Suggested response updated with latest conversation.");
      }
    } catch {
      toast.error("Analysis Error", "Failed to analyze ticket conversation.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApplyPriority = async () => {
    if (!intel?.recommended_priority) return;
    setApplyingPriority(true);
    try {
      const res = await AxiosInstance.post(`/tickets/${ticketId}/apply-priority`);
      if (res.data?.success) {
        toast.success("Priority Applied", res.data.message || "Updated priority");
        if (onPriorityUpdated) onPriorityUpdated();
        fetchIntelligence();
      }
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to update priority");
    } finally {
      setApplyingPriority(false);
    }
  };

  const handleUseResponseClick = () => {
    if (intel?.suggested_response && onUseResponse) {
      onUseResponse(intel.suggested_response);
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
      toast.success("Copilot Response Inserted", "Inserted response into editor.");
    }
  };

  const handleLogFeedback = async (status: "accepted" | "edited" | "rejected") => {
    try {
      await AxiosInstance.post(`/tickets/${ticketId}/ai-feedback`, { status });
    } catch {
      /* silent log */
    }
  };

  if (loading) {
    return (
      <div className="p-4 rounded-xl border bg-card/60 dark:border-white/[0.06] text-center space-y-3">
        <div className="flex items-center justify-center gap-2 text-primary font-medium text-sm">
          <Sparkles className="h-4 w-4 animate-spin text-primary" />
          <span>Analyzing Ticket Intelligence...</span>
        </div>
      </div>
    );
  }

  if (!intel) {
    return (
      <div className="p-4 rounded-xl border bg-card/60 dark:border-white/[0.06] text-center space-y-3">
        <p className="text-xs text-muted-foreground">No AI intelligence generated yet.</p>
        <Button size="sm" variant="outline" onClick={triggerReAnalysis} disabled={analyzing}>
          <Sparkles className="h-3.5 w-3.5 mr-1 text-primary" />
          Run AI Analysis
        </Button>
      </div>
    );
  }

  const sentimentColor =
    intel.sentiment === "frustrated" || intel.sentiment === "angry"
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";

  const slaRiskColor =
    intel.sla_risk === "at_risk" || intel.sla_risk === "breached"
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20"
      : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";

  return (
    <div className="space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between p-3.5 rounded-xl border bg-gradient-to-r from-primary/10 via-card to-card dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              AI Ticket Intelligence
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-mono border border-primary/20">
                {intel.ai_confidence}% Confidence
              </span>
            </h4>
            <p className="text-[11px] text-muted-foreground">{intel.intent || "General Inquiry"}</p>
          </div>
        </div>

        <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={triggerReAnalysis} disabled={analyzing}>
          <RefreshCw className={`h-3.5 w-3.5 ${analyzing ? "animate-spin text-primary" : ""}`} />
        </Button>
      </div>

      {/* Escalation Alert Warning */}
      {intel.escalation_recommended && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 space-y-2">
          <div className="flex items-start gap-2">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold uppercase text-[11px] tracking-wider block">Escalation Recommended</span>
              <p className="text-xs text-rose-600 dark:text-rose-300 mt-0.5">{intel.escalation_reason}</p>
            </div>
          </div>
          {onEscalate && (
            <Button size="sm" onClick={onEscalate} className="w-full h-7 text-xs bg-rose-600 hover:bg-rose-700 text-white font-medium">
              Escalate Ticket Now
            </Button>
          )}
        </div>
      )}

      {/* Priority Recommendation Banner */}
      {intel.recommended_priority && intel.recommended_priority !== intel.priority && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            <div>
              <span className="font-bold text-amber-600 dark:text-amber-400">
                AI Suggests Priority: <span className="uppercase">{intel.recommended_priority}</span>
              </span>
              <p className="text-[10px] text-muted-foreground">{intel.priority_reasons?.[0] || "Customer SLA Risk"}</p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={handleApplyPriority} disabled={applyingPriority} className="h-7 text-[11px] border-amber-500/40 text-amber-600 hover:bg-amber-500/10">
            {applyingPriority ? "Applying..." : "Apply"}
          </Button>
        </div>
      )}

      {/* 1. Ticket Understanding Grid */}
      <div className="p-3.5 rounded-xl border bg-card dark:border-white/[0.06] space-y-3">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-primary" /> Ticket Understanding
        </h5>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Category</span>
            <span className="font-semibold text-foreground uppercase">{intel.category}</span>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Sentiment</span>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${sentimentColor}`}>
              {intel.sentiment}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">Severity</span>
            <span className="font-semibold text-foreground uppercase">{intel.severity}</span>
          </div>
          <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
            <span className="text-[10px] text-muted-foreground block">SLA Risk</span>
            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${slaRiskColor}`}>
              {intel.sla_risk} ({intel.remaining_sla_minutes != null ? `${intel.remaining_sla_minutes}m left` : "Tracked"})
            </span>
          </div>
        </div>

        {intel.summary && (
          <p className="text-xs text-muted-foreground leading-relaxed italic border-t border-border/40 pt-2">
            "{intel.summary}"
          </p>
        )}
      </div>

      {/* 2. Assignment Policy & Workload Reasoning */}
      <div className="p-3.5 rounded-xl border bg-card dark:border-white/[0.06] space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <h5 className="font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 text-[11px]">
            <UserCheck className="h-3.5 w-3.5 text-primary" /> Assignment Policy Engine
          </h5>
          <span className="px-1.5 py-0.5 rounded bg-muted text-[10px] font-mono text-muted-foreground border">
            {intel.policy_code}
          </span>
        </div>
        <div className="p-2.5 rounded-lg bg-muted/30 border border-border/50 text-[11px] leading-relaxed text-foreground">
          <span className="font-semibold text-primary block">Recommended Team: {intel.recommended_team}</span>
          <p className="text-muted-foreground mt-0.5">{intel.assignment_reason}</p>
        </div>
      </div>

      {/* 3. Knowledge Sources & Knowledge Graph Tree */}
      <div className="p-3.5 rounded-xl border bg-card dark:border-white/[0.06] space-y-3">
        <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-purple-400" /> Knowledge Sources & Graph
        </h5>

        {/* Knowledge Graph Breadcrumbs */}
        {intel.knowledge_graph_path?.length > 0 && (
          <div className="flex flex-wrap items-center gap-1 text-[11px] font-mono p-2 rounded-lg bg-purple-500/5 border border-purple-500/20">
            {intel.knowledge_graph_path.map((step: string, idx: number) => (
              <React.Fragment key={idx}>
                <span className="text-purple-400 font-semibold">{step}</span>
                {idx < intel.knowledge_graph_path.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground" />}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* RAG Sources */}
        <div className="space-y-1.5 text-xs">
          {(intel.knowledge_sources || []).map((source: any, idx: number) => (
            <div key={idx} className="p-2 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between">
              <span className="truncate font-medium text-foreground text-[11px]">{source.title}</span>
              <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[10px]">
                {source.score}% match
              </Badge>
            </div>
          ))}
        </div>
      </div>

      {/* 4. AI Copilot Suggested Response Workspace */}
      <div className="p-3.5 rounded-xl border bg-card dark:border-white/[0.06] space-y-3">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Copilot Suggested Response
          </h5>
        </div>

        <div className="p-3 rounded-lg bg-muted/20 border border-border/60 text-xs font-sans text-foreground whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto relative min-h-[60px]">
          {analyzing ? (
            <div className="flex items-center gap-2 text-muted-foreground py-2 italic">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
              <span>Analyzing full conversation and generating reply...</span>
            </div>
          ) : (
            intel.suggested_response || "Generating suggested response..."
          )}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {onUseResponse && (
            <Button size="sm" disabled={analyzing} onClick={() => { handleUseResponseClick(); handleLogFeedback("accepted"); }} className="flex-1 h-8 text-xs gap-1.5">
              {copiedResponse ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Send className="h-3.5 w-3.5" />}
              {copiedResponse ? "Inserted!" : "Use Response"}
            </Button>
          )}
          <Button size="sm" variant="outline" disabled={analyzing} onClick={triggerReAnalysis} className="h-8 text-xs gap-1.5">
            {analyzing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
            {analyzing ? "Regenerating..." : "Regenerate"}
          </Button>
        </div>
      </div>

      {/* 5. Collapsible Structured Ticket Summary */}
      {intel.structured_summary && (
        <div className="rounded-xl border bg-card dark:border-white/[0.06] overflow-hidden text-xs">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="w-full p-3 flex items-center justify-between text-left font-semibold text-foreground hover:bg-muted/30 transition-colors"
          >
            <span>Structured Conversation Summary</span>
            {showSummary ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {showSummary && (
            <div className="p-3 border-t border-border/50 space-y-2 text-[11px] leading-relaxed text-muted-foreground">
              <p><strong className="text-foreground">Problem:</strong> {intel.structured_summary.problem}</p>
              <p><strong className="text-foreground">Next Action:</strong> {intel.structured_summary.next_step}</p>
              <p><strong className="text-foreground">Knowledge Used:</strong> {intel.structured_summary.knowledge_used}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
