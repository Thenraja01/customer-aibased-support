import { memo, useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Bot, User, Copy, ThumbsUp, ThumbsDown, Check, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ChatMessage as MessageType } from "@/types/chat";
import DocumentViewer from "@/components/ui/DocumentViewer";

interface ChatMessageProps {
  message: MessageType;
  isOwn: boolean;
  onEscalate?: () => void;
}

function renderMarkdown(text: string) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted/50 dark:bg-white/[0.04] rounded-lg p-3 my-2 text-xs overflow-x-auto font-mono border border-border"><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted/50 dark:bg-white/[0.04] px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  html = html.replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-semibold text-base mt-3 mb-1">$2</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-bold text-lg mt-3 mb-1">$1</h1>');

  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc text-sm leading-relaxed">$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm leading-relaxed">$2</li>');

  html = html.replace(/\n/g, "<br />");

  return html;
}

const ChatMessage = memo(function ChatMessage({ message, isOwn, onEscalate }: ChatMessageProps) {
  const isAI = message.is_ai;
  const { orgSettings } = useAuth();
  const botName = orgSettings?.chatbot_name || "AI Assistant";
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);

  const [selectedSource, setSelectedSource] = useState<any>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleSourceClick = useCallback((src: any) => {
    const docId = src.documentId || src._id;
    if (!docId) return;
    const baseUrl = (import.meta.env.VITE_BACKEND_URL || "").replace(/\/$/, "");
    setSelectedSource({
      id: docId,
      title: src.title || "Source Document",
      url: `${baseUrl}/documents/${docId}/view`,
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

  // Extract sources if present in message metadata
  const sources = (message as any).citations || (message as any).sources || [];

  return (
    <div className={cn("group py-1 px-4", isOwn ? "flex justify-end" : "flex justify-start")}>
      <div className={cn("flex gap-3 max-w-[85%] sm:max-w-[75%]", isOwn && "flex-row-reverse")}>
        {/* Avatar */}
        <div
          className={cn(
            "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-1",
            isAI
              ? "bg-primary/10"
              : "bg-muted"
          )}
        >
          {isAI ? <Bot size={14} className="text-primary" /> : <User size={14} className="text-muted-foreground" />}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className={cn("text-[11px] font-medium mb-1", isOwn ? "text-right" : "text-left", "text-muted-foreground")}>
            {isAI ? botName : "You"}
          </div>

          <div
            className={cn(
              "rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-card border border-border rounded-bl-md"
            )}
          >
            {isAI ? (
              (() => {
                const confidence = (message as any).confidence;
                const responseMode = (message as any).responseMode;
                const isMedium = responseMode === "suggest_and_offer_human" || (typeof confidence === "number" && confidence >= 0.50 && confidence < 0.75);
                const isLow = responseMode === "no_confidence" || (typeof confidence === "number" && confidence < 0.50);
                return (
                  <>
                    <div
                      className="prose prose-sm dark:prose-invert max-w-none text-[13.5px] leading-relaxed [&_pre]:my-2 [&_code]:text-xs [&_strong]:font-semibold [&_em]:italic [&_li]:my-0.5"
                      dangerouslySetInnerHTML={renderedContent!}
                    />
                    {isMedium && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/40 dark:border-white/[0.05] flex flex-col gap-2">
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 italic">
                          ⚠️ This response has moderate relevance. Would you like to connect with a support agent?
                        </p>
                        {onEscalate && (
                          <button
                            type="button"
                            onClick={onEscalate}
                            className="self-start text-[10.5px] font-semibold px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            Connect with Human Agent
                          </button>
                        )}
                      </div>
                    )}
                    {isLow && (
                      <div className="mt-2.5 pt-2.5 border-t border-border/40 dark:border-white/[0.05] flex flex-col gap-2">
                        <p className="text-[11px] text-rose-600 dark:text-rose-400 font-medium">
                          ℹ️ The assistant is uncertain about this query. Escalate to a human representative?
                        </p>
                        {onEscalate && (
                          <button
                            type="button"
                            onClick={onEscalate}
                            className="self-start text-[10.5px] font-semibold px-2.5 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                          >
                            Escalate to Human Agent
                          </button>
                        )}
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

          {/* Sources */}
          {isAI && sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {sources.map((src: any, i: number) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSourceClick(src)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-muted/50 border border-border text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                >
                  <FileText size={11} />
                  <span className="truncate max-w-[120px]">{src.title || `Source ${i + 1}`}</span>
                </button>
              ))}
            </div>
          )}

          {/* Meta row */}
          <div className={cn("flex items-center gap-2 mt-1.5", isOwn ? "justify-end" : "justify-start")}>
            <span className="text-[10px] text-muted-foreground/50">
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>

            {/* AI action buttons */}
            {isAI && (
              <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="p-1 rounded-md hover:bg-muted text-muted-foreground/60 hover:text-foreground transition-colors"
                  aria-label="Copy message"
                >
                  {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback(feedback === "up" ? null : "up")}
                  className={cn(
                    "p-1 rounded-md hover:bg-muted transition-colors",
                    feedback === "up" ? "text-emerald-500" : "text-muted-foreground/60 hover:text-foreground"
                  )}
                  aria-label="Helpful"
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setFeedback(feedback === "down" ? null : "down")}
                  className={cn(
                    "p-1 rounded-md hover:bg-muted transition-colors",
                    feedback === "down" ? "text-red-500" : "text-muted-foreground/60 hover:text-foreground"
                  )}
                  aria-label="Not helpful"
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
        />
      )}
    </div>
  );
});

export default ChatMessage;
