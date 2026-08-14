import { memo } from "react";
import { Bot } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TypingIndicator = memo(function TypingIndicator() {
  const { orgSettings } = useAuth();
  const botName = orgSettings?.chatbot_name || "AI Assistant";

  return (
    <div className="flex justify-start py-1 px-4">
      <div className="flex gap-3 max-w-[75%]">
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center mt-1">
          <Bot size={14} className="text-primary" />
        </div>
        <div>
          <div className="text-[11px] font-medium mb-1 text-muted-foreground">{botName}</div>
          <div className="rounded-2xl rounded-bl-md bg-card border border-border px-4 py-3">
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
              <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;