import { memo, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Check, FileText, LifeBuoy, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage as MessageType } from "@/types/chat";
import DocumentViewer from "@/components/ui/DocumentViewer";
import DocumentAPI from "@/api/document.api.js";
import { useToast } from "@/components/ui/toast";

interface ChatMessageProps {
  message: MessageType;
  isOwn?: boolean;
  onEscalate?: () => void;
  onQuickAction?: (query: string) => void;
}

function renderMarkdown(text: string) {
  if (!text) return "";

  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Code blocks
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted/60 dark:bg-slate-900/80 rounded-xl p-3 my-2 text-xs overflow-x-auto font-mono border border-border/80 shadow-xs"><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted/60 dark:bg-slate-800/80 px-1.5 py-0.5 rounded text-xs font-mono text-primary font-medium">$1</code>');

  // Horizontal rules / ASCII divider lines (e.g. ====== or -------)
  html = html.replace(/^[=\-]{4,}$/gm, '<hr class="my-3 border-border/60" />');

  // Headings
  html = html.replace(/^#### (.+)$/gm, '<h4 class="font-bold text-xs uppercase tracking-wider text-muted-foreground mt-3 mb-1">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="font-bold text-sm text-foreground mt-3.5 mb-1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-extrabold text-base text-foreground mt-4 mb-1.5">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-extrabold text-lg text-foreground mt-4 mb-2">$1</h1>');

  // Section titles with number prefix (e.g. "11. PROJECT DELIVERABLES")
  html = html.replace(/^(\d+\.\s+[A-Z\s\-_]{3,})$/gm, '<h3 class="font-bold text-sm text-primary mt-3.5 mb-1 tracking-wide">$1</h3>');

  // Key-value bullets (e.g. "* Core Backend: Node.js" or "- Primary Database: MongoDB")
  html = html.replace(/^[\-\*]\s+([A-Za-z0-9\s/_\(\)]+):/gm, '<li class="ml-4 list-disc text-[13.5px] leading-relaxed my-0.5"><strong class="text-foreground">$1:</strong>');

  // Standard bullets
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc text-[13.5px] leading-relaxed my-0.5">$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-[13.5px] leading-relaxed my-0.5">$2</li>');

  // Bold & Italic
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-foreground">$1</strong>');
  html = html.replace(/([^\*]|^)\*([^\*\n]+?)\*([^\*]|$)/g, '$1<em>$2</em>$3');

  // Paragraph line breaks (prevent double spacing on lists and headings)
  html = html.replace(/\n(?!(?:<\/(?:li|h1|h2|h3|h4|pre|hr)>|<hr|<pre))/g, "<br />");

  return html;
}

const ChatMessage = memo(function ChatMessage({ message, isOwn: _isOwn, onEscalate, onQuickAction }: ChatMessageProps) {
  const isAI = message.is_ai;
  const isUser = !isAI; // User message is ALWAYS on the right, AI message is ALWAYS on the left
  const { orgSettings } = useAuth();
  const toast = useToast();
  const botName = orgSettings?.chatbot_name || "Support AI Copilot";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [showAllSources, setShowAllSources] = useState(false);

  const handleSourceClick = useCallback(async (src: any) => {
    const docId = src.documentId || src._id || src.id;
    const title = src.title || src.documentName || "Source Document";

    let resolvedUrl = src.url || src.file_url || "#";
    if (docId && docId !== "source-doc") {
      try {
        resolvedUrl = await DocumentAPI.resolveDocumentUrl(docId);
      } catch {
        resolvedUrl = `/documents/${docId}/view`;
      }
    }

    setSelectedSource({
      id: docId,
      title,
      url: resolvedUrl,
      citation: src,
    });
    setIsViewerOpen(true);
  }, []);

  const renderedContent = useMemo(() => {
    if (!isAI) return null;
    return { __html: renderMarkdown(message.content) };
  }, [isAI, message.content]);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [message.content]);

  const handleFeedback = useCallback(async (type: "up" | "down") => {
    const newFeedback = feedback === type ? null : type;
    setFeedback(newFeedback);
    if (!newFeedback) return;

    try {
      const AxiosInstance = (await import("@/api/axiosInstance")).default;
      await AxiosInstance.post("/feedback", {
        chat_id: message.chat_id,
        message_id: message._id,
        rating: type === "up" ? 5 : 1,
        was_helpful: type === "up",
      });
    } catch (err) {
      console.warn("[ChatMessage] Feedback submit notice:", err);
    }
  }, [feedback, message]);

  // Extract sources from message citations
  const sources = (message as any).citations || (message as any).sources || [];

  return (
    <div className={cn("group py-2 px-4 w-full flex", isUser ? "justify-end" : "justify-start")}>
      <div className={cn("flex gap-3 max-w-[88%] sm:max-w-[78%]", isUser && "flex-row-reverse")}>
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-1 shadow-sm border",
            isAI
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-primary/10 border-primary/20 text-primary"
          )}
        >
          {isAI ? <Bot size={16} /> : <User size={16} />}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0">
          <div className={cn("text-[11px] font-semibold mb-1 flex items-center gap-2", isUser ? "justify-end text-muted-foreground" : "justify-start text-muted-foreground")}>
            <span>{isAI ? botName : "You"}</span>
          </div>

          <div
            className={cn(
              "rounded-2xl px-4 py-3 text-sm leading-relaxed transition-all shadow-sm",
              isUser
                ? "bg-primary text-primary-foreground font-medium rounded-br-sm shadow-md"
                : "bg-card/90 backdrop-blur-xl border border-border/80 rounded-bl-sm text-foreground shadow-sm"
            )}
          >
            {isAI ? (
              (() => {
                const textLower = (message.content || "").toLowerCase();
                const isMissingInfo =
                  textLower.includes("couldn't find") ||
                  textLower.includes("could not find") ||
                  textLower.includes("don't have") ||
                  textLower.includes("do not have") ||
                  textLower.includes("no information") ||
                  textLower.includes("unavailable") ||
                  textLower.includes("unable to find") ||
                  textLower.includes("not found");

                const confidence = (message as any).confidence;
                const responseMode = (message as any).responseMode;
                const escalation = (message as any).escalation || {};
                const isLowConfidence =
                  isMissingInfo ||
                  escalation.available ||
                  feedback === "down" ||
                  responseMode === "no_confidence" ||
                  (typeof confidence === "number" && confidence < 0.75);

                return (
                  <>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-[13.5px] leading-relaxed [&_pre]:my-2 [&_code]:text-xs [&_strong]:font-semibold [&_em]:italic [&_li]:my-0.5"
                      dangerouslySetInnerHTML={renderedContent!}
                    />

                    {/* Conditional Support & Escalation Card (Shown ONLY when confidence < 0.75, negative feedback 👎, or unresolved) */}
                    {isLowConfidence && (
                      <div className="mt-3.5 p-3.5 rounded-xl bg-card/80 border border-border/80 text-foreground flex flex-col gap-2.5 shadow-sm">
                        <p className="text-[12px] text-muted-foreground leading-relaxed font-medium">
                          Need more details or direct human assistance?
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                const { ChatAPI } = await import("@/api/chat.api.js");
                                await ChatAPI.handoff(message.chat_id, "user_requested");
                                toast.success("Support Request Initiated", "A live support specialist is joining your chat.");
                              } catch (err: any) {
                                toast.error("Handoff Error", err?.response?.data?.message || "Failed to initiate agent chat.");
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500 text-black hover:bg-emerald-400 transition-all shadow-sm active:scale-95"
                          >
                            <Bot size={13} />
                            Chat with Support Agent
                          </button>

                          {onEscalate && (
                            <button
                              type="button"
                              onClick={onEscalate}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted hover:bg-muted/80 text-foreground border border-border/80 transition-all active:scale-95"
                            >
                              <LifeBuoy size={13} className="text-amber-500" />
                              Raise a Ticket
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <div className="whitespace-pre-wrap break-words text-[13.5px]">
                {message.content}
              </div>
            )}
          </div>

          {/* Structured Document Sources Bar */}
          {isAI && sources.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70 mr-1">
                Source:
              </span>
              {(showAllSources ? sources : sources.slice(0, 1)).map((src: any, i: number) => {
                const docName = src.documentName || src.title || `Document ${i + 1}`;
                const pageNum = src.pageNumber || (typeof src.chunkIndex === "number" ? src.chunkIndex + 1 : null);
                const score = src.relevanceScore ?? src.score;
                const matchPct = score ? Math.round(score * 100) : null;

                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSourceClick(src)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-muted/60 border border-border/80 text-muted-foreground hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all active:scale-95 shadow-2xs"
                  >
                    <FileText size={12} className="text-primary shrink-0" />
                    <span className="truncate max-w-[180px]">📄 {docName}</span>
                    {pageNum && <span className="text-[10px] font-semibold text-muted-foreground/70">· Page {pageNum}</span>}
                    {matchPct && (
                      <span className="text-[9.5px] font-mono text-emerald-500 font-bold">
                        ({matchPct}%)
                      </span>
                    )}
                  </button>
                );
              })}
              {sources.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllSources(!showAllSources)}
                  className="text-[10.5px] font-medium text-primary hover:underline ml-1 px-1.5 py-0.5 rounded bg-primary/5 hover:bg-primary/10 transition-colors"
                >
                  {showAllSources ? "Show less" : `+${sources.length - 1} more`}
                </button>
              )}
            </div>
          )}

          {/* Interactive Contextual Quick Actions */}
          {isAI && Array.isArray((message as any).quickActions) && (message as any).quickActions.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-border/40">
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1 mr-1">
                <Sparkles size={11} className="text-primary" /> Suggested:
              </span>
              {(message as any).quickActions.map((qa: any, qi: number) => (
                <button
                  key={qi}
                  type="button"
                  onClick={() => onQuickAction?.(qa.query || qa.label)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all hover:scale-[1.02] active:scale-95 shadow-2xs cursor-pointer"
                >
                  {qa.label}
                </button>
              ))}
            </div>
          )}

          {/* Meta & Interactive Toolbar */}
          <div className={cn("flex items-center gap-2 mt-1.5", isUser ? "justify-end" : "justify-start")}>
            <span className="text-[10px] text-muted-foreground/60 font-mono">
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {/* AI Action Tools (Helpful Feedback 👍 👎 shown on high-confidence messages) */}
            {isAI && (
              <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity bg-card/80 backdrop-blur-sm border border-border/50 rounded-lg px-2 py-1 shadow-2xs">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Copy message"
                  title="Copy message"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                <div className="h-3 w-[1px] bg-border/60 mx-0.5" />
                <span className="text-[10px] text-muted-foreground/70 font-medium">Was this helpful?</span>
                <button
                  type="button"
                  onClick={() => handleFeedback("up")}
                  className={cn(
                    "p-1 rounded-md hover:bg-muted transition-colors",
                    feedback === "up" ? "text-emerald-500 font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Helpful"
                  title="Helpful"
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedback("down")}
                  className={cn(
                    "p-1 rounded-md hover:bg-muted transition-colors",
                    feedback === "down" ? "text-rose-500 font-bold" : "text-muted-foreground hover:text-foreground"
                  )}
                  aria-label="Not helpful"
                  title="Not helpful"
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSource && (
        <DocumentViewer
          title={selectedSource.title}
          fileUrl={selectedSource.url}
          isOpen={isViewerOpen}
          onClose={() => setIsViewerOpen(false)}
          citation={selectedSource.citation}
        />
      )}
    </div>
  );
});

export default ChatMessage;

