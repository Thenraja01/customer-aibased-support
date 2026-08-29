import React, { useState, useEffect } from "react";
import { Sparkles, BookOpen, ChevronRight, FileText, Wand2, Copy, Check, MessageSquareText, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AxiosInstance from "@/api/axiosInstance";

interface AIIntelligencePanelProps {
  chatId?: string;
  intent?: string;
  confidence?: number;
  escalationReason?: string;
  suggestedCategory?: string;
  sources?: any[];
  compact?: boolean;
  onApplyReply?: (text: string) => void;
}

export const AIIntelligencePanel: React.FC<AIIntelligencePanelProps> = ({
  chatId,
  intent = "General Inquiry",
  confidence = 92,
  escalationReason = "Knowledge gap detected / Customer requested agent",
  suggestedCategory = "General",
  sources = [
    { id: "1", title: "CyberTech Shipping & Delivery Policy FAQ", score: "0.95", type: "faq" },
    { id: "2", title: "Warranty_Refund_Policy_2026.pdf", score: "0.92", type: "document" },
  ],
  compact = false,
  onApplyReply,
}) => {
  const [selectedSource, setSelectedSource] = useState<any | null>(null);
  const [summary, setSummary] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [polishingTone, setPolishingTone] = useState<string | null>(null);

  useEffect(() => {
    if (chatId) {
      fetchCopilotSummary();
      fetchCopilotSuggestions();
    }
  }, [chatId]);

  const fetchCopilotSummary = async () => {
    if (!chatId) return;
    setLoadingSummary(true);
    try {
      const res = await AxiosInstance.get(`/api/v1/chats/${chatId}/copilot-summary`);
      if (res.data.success) {
        setSummary(res.data.data.summary);
      }
    } catch {
      setSummary("Customer initiated a live support session regarding product or policy questions.");
    } finally {
      setLoadingSummary(false);
    }
  };

  const fetchCopilotSuggestions = async () => {
    if (!chatId) return;
    setLoadingSuggestions(true);
    try {
      const res = await AxiosInstance.get(`/api/v1/chats/${chatId}/copilot-suggestions`);
      if (res.data.success && Array.isArray(res.data.data.suggestions)) {
        setSuggestions(res.data.data.suggestions);
      }
    } catch {
      setSuggestions([
        "Hello! I am reviewing your request right now and will assist you immediately.",
        "Thank you for your patience! Let me check the details for you.",
        "I understand your issue and am happy to help resolve this right away."
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handlePolishTone = async (draft: string, tone: string) => {
    setPolishingTone(tone);
    try {
      const res = await AxiosInstance.post("/api/v1/chats/polish-reply", { text: draft, tone });
      if (res.data.success && res.data.data.text) {
        if (onApplyReply) onApplyReply(res.data.data.text);
      }
    } catch {
      /* ignore */
    } finally {
      setPolishingTone(null);
    }
  };

  if (compact) {
    return (
      <div className="p-3 bg-amber-500/5 border-b border-amber-500/20 px-6 flex items-start gap-3 shrink-0 text-xs">
        <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-amber-600 dark:text-amber-400 uppercase text-[10px] tracking-wider">
              AI Support Intelligence & Copilot
            </span>
            <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30">
              Confidence: {confidence}%
            </Badge>
          </div>
          <p className="text-foreground font-medium truncate">
            <strong>Summary:</strong> {summary || "Analyzing chat..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-card border rounded-2xl space-y-4 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2">
          <Wand2 size={18} className="text-indigo-500 animate-pulse" />
          <h3 className="font-extrabold text-sm">AI Agent Copilot</h3>
        </div>
        <Badge
          className={`font-mono text-xs ${
            confidence >= 80
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30"
              : "bg-amber-500/10 text-amber-600 border-amber-500/30"
          }`}
          variant="outline"
        >
          {confidence}% Confidence
        </Badge>
      </div>

      {/* Conversation Summary Box */}
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-extrabold text-indigo-400 uppercase tracking-wider block">
            1-Click Conversation Summary
          </span>
          <button
            onClick={fetchCopilotSummary}
            className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1"
          >
            <RefreshCcw size={10} className={loadingSummary ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
        <p className="text-foreground text-[11px] leading-relaxed font-medium">
          {loadingSummary ? "Summarizing conversation..." : summary || "Customer requested agent support regarding knowledge base inquiry."}
        </p>
      </div>

      {/* Suggested Replies */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-muted-foreground uppercase text-[10px] flex items-center gap-1">
            <MessageSquareText size={12} className="text-primary" />
            AI Suggested Responses
          </span>
          <span className="text-[10px] text-muted-foreground">{suggestions.length} candidates</span>
        </div>

        {loadingSuggestions ? (
          <div className="p-4 text-center text-xs text-muted-foreground">Generating suggestions...</div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((sug, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border bg-background hover:bg-muted/50 transition space-y-2 text-xs"
              >
                <p className="text-foreground text-[11px] font-medium leading-relaxed">"{sug}"</p>
                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <div className="flex items-center gap-1 text-[10px]">
                    <span className="text-muted-foreground">Tone:</span>
                    <button
                      onClick={() => handlePolishTone(sug, "empathetic")}
                      className="px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-500 font-bold hover:bg-pink-500/20"
                    >
                      {polishingTone === "empathetic" ? "Polishing..." : "Empathetic"}
                    </button>
                    <button
                      onClick={() => handlePolishTone(sug, "concise")}
                      className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold hover:bg-blue-500/20"
                    >
                      {polishingTone === "concise" ? "Polishing..." : "Concise"}
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[10px] bg-primary/10 text-primary hover:bg-primary/20 font-bold"
                    onClick={() => {
                      if (onApplyReply) onApplyReply(sug);
                      setCopiedIndex(idx);
                      setTimeout(() => setCopiedIndex(null), 2000);
                    }}
                  >
                    {copiedIndex === idx ? <Check size={12} className="text-emerald-500 mr-1" /> : <Copy size={12} className="mr-1" />}
                    {copiedIndex === idx ? "Applied!" : "Use Reply"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Relevant Sources */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-muted-foreground uppercase text-[10px]">
            Knowledge Base Citations
          </span>
          <span className="text-[10px] text-muted-foreground">{sources.length} sources</span>
        </div>

        <div className="space-y-1.5">
          {sources.map((src, idx) => (
            <div
              key={src.id || idx}
              onClick={() => setSelectedSource(src)}
              className="p-2.5 rounded-xl border bg-background hover:bg-muted/60 transition cursor-pointer flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <FileText size={14} className="text-primary shrink-0" />
                <span className="font-medium truncate">{src.title}</span>
              </div>
              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
