import { memo, useMemo, useState, useCallback } from "react";

import { cn } from "@/lib/utils";
import { Headphones, User, ThumbsUp, ThumbsDown, FileText } from "lucide-react";
import type { ChatMessage as MessageType } from "@/types/chat";
import { MessageAPI } from "@/api";
import ChatOptionCards, { parseOptions } from "./ChatOptionCards";
import SuggestedFollowUps from "./SuggestedFollowUps";

interface ChatMessageProps {
  message: MessageType;
  isOwn: boolean;
  onOptionSelect?: (text: string) => void;
}

function renderMarkdown(text: string) {
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted/50 dark:bg-white/[0.05] rounded-lg p-3 my-2 text-xs overflow-x-auto font-mono"><code>$2</code></pre>');
  html = html.replace(/`([^`]+)`/g, '<code class="bg-muted/50 dark:bg-white/[0.05] px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, "<em>$1</em>");

  html = html.replace(/^### (.+)$/gm, '<h3 class="font-semibold text-sm mt-3 mb-1">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="font-semibold text-base mt-3 mb-1">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="font-bold text-lg mt-3 mb-1">$1</h1>');

  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc text-sm">$1</li>');
  html = html.replace(/^(\d+)\. (.+)$/gm, '<li class="ml-4 list-decimal text-sm">$2</li>');

  html = html.replace(/\n/g, "<br />");

  return html;
}

function parseSources(content: string): string[] {
  const sources: string[] = [];
  const sourcePatternA = /\[Source:\s*(.+?)\]/g;
  let match;
  while ((match = sourcePatternA.exec(content)) !== null) {
    sources.push(match[1].trim());
  }
  const sourcePatternB = /\*\*Source:\*\*\s*(.+?)(?:\n|$|\s*\*\*)/g;
  while ((match = sourcePatternB.exec(content)) !== null) {
    const val = match[1].trim();
    if (!sources.includes(val)) sources.push(val);
  }
  return sources;
}

function stripSourcePatterns(content: string): string {
  return content
    .replace(/\[Source:\s*.+?\]/g, "")
    .replace(/\*\*Source:\*\*\s*.+?(\n|$)/g, "$1")
    .replace(/\*\*Choose an option:\*\*[\s\S]*$/i, "")
    .trim();
}

function parseConfidence(content: string): number | null {
  const match = content.match(/\*\*Confidence:\*\*\s*(\d+(?:\.\d+)?)/i);
  if (match) return parseFloat(match[1]);
  const match2 = content.match(/confidence[:\s]+(\d+(?:\.\d+)?)/i);
  if (match2) return parseFloat(match2[1]);
  return null;
}

function ConfidenceBadge({ confidence }: { confidence: number }) {
  let label: string;
  let color: string;
  if (confidence > 0.8) {
    label = "High";
    color = "bg-green-500";
  } else if (confidence >= 0.5) {
    label = "Medium";
    color = "bg-yellow-500";
  } else {
    label = "Low";
    color = "bg-red-500";
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
      <span className={cn("w-1.5 h-1.5 rounded-full", color)} />
      {label}
    </span>
  );
}

function SourceCitations({ sources }: { sources: string[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {sources.map((src) => (
        <span
          key={src}
          className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]",
            "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400",
            "border border-blue-200 dark:border-blue-800/30"
          )}
        >
          <FileText size={10} />
          {src}
        </span>
      ))}
    </div>
  );
}

const ChatMessage = memo(function ChatMessage({ message, isOwn, onOptionSelect }: ChatMessageProps) {
  const isAI = message.is_ai;
  const [feedbackState, setFeedbackState] = useState<string | null>(message.feedback || null);

  const handleFeedback = async (feedback: string) => {
    try {
      await MessageAPI.updateFeedback(message._id, feedback === feedbackState ? null : feedback);
      setFeedbackState(feedback === feedbackState ? null : feedback);
    } catch (e) { console.error(e); }
  };

  const sources = useMemo(
    () => (isAI ? parseSources(message.content) : []),
    [isAI, message.content]
  );

  const confidence = useMemo(
    () => (isAI ? parseConfidence(message.content) : null),
    [isAI, message.content]
  );

  const options = useMemo(
    () => (isAI ? parseOptions(message.content) : null),
    [isAI, message.content]
  );

  const cleanContent = useMemo(() => {
    if (!isAI) return message.content;
    return stripSourcePatterns(message.content);
  }, [isAI, message.content]);

  const renderedContent = useMemo(() => {
    if (!isAI) return null;
    return { __html: renderMarkdown(cleanContent) };
  }, [isAI, cleanContent]);

  const handleOptionSelect = useCallback(
    (text: string) => {
      onOptionSelect?.(text);
    },
    [onOptionSelect]
  );

  return (
    <div
      className={cn(
        "w-full transition-colors",
        isOwn ? "bg-muted/50 dark:bg-white/[0.03]" : "bg-background"
      )}
    >
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex gap-3">
          <div
            className={cn(
              "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5",
              isAI
                ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-sm shadow-primary/20"
                : "bg-muted dark:bg-white/[0.06] text-muted-foreground"
            )}
          >
            {isAI ? <Headphones size={14} /> : <User size={14} />}
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold mb-1">
              {isAI ? "Support Assistant" : "You"}
            </div>
            {isAI ? (
              <div
                className="text-sm leading-relaxed text-foreground/90 prose prose-sm dark:prose-invert max-w-none [&_pre]:my-2 [&_code]:text-xs [&_strong]:font-semibold [&_em]:italic"
                dangerouslySetInnerHTML={renderedContent!}
              />
            ) : (
              <div className="text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
                {message.content}
              </div>
            )}

            {options && onOptionSelect && (
              <ChatOptionCards options={options} onSelect={handleOptionSelect} />
            )}

            <SourceCitations sources={sources} />

            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] text-muted-foreground">
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {confidence !== null && <ConfidenceBadge confidence={confidence} />}
            </div>

            {isAI && (
              <div className="flex items-center gap-1 mt-1.5">
                <button
                  onClick={() => handleFeedback("helpful")}
                  className={cn(
                    "p-1 rounded transition-colors",
                    feedbackState === "helpful"
                      ? "text-green-500 bg-green-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title="Helpful"
                >
                  <ThumbsUp size={12} />
                </button>
                <button
                  onClick={() => handleFeedback("not_helpful")}
                  className={cn(
                    "p-1 rounded transition-colors",
                    feedbackState === "not_helpful"
                      ? "text-red-500 bg-red-500/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                  title="Not helpful"
                >
                  <ThumbsDown size={12} />
                </button>
              </div>
            )}

            {isAI && onOptionSelect && (
              <SuggestedFollowUps messageContent={cleanContent} onSelect={handleOptionSelect} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatMessage;
