import { memo, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Headphones, User } from "lucide-react";
import type { ChatMessage as MessageType } from "@/types/chat";

interface ChatMessageProps {
  message: MessageType;
  isOwn: boolean;
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

const ChatMessage = memo(function ChatMessage({ message, isOwn }: ChatMessageProps) {
  const isAI = message.is_ai;

  const renderedContent = useMemo(() => {
    if (!isAI) return null;
    return { __html: renderMarkdown(message.content) };
  }, [isAI, message.content]);

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
            <div className="text-[10px] text-muted-foreground mt-1.5">
              {new Date(message.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ChatMessage;
