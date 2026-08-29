import { memo } from "react";
import { Bot, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TypingIndicator = memo(function TypingIndicator() {
  const { orgSettings } = useAuth();
  const botName = orgSettings?.chatbot_name || "Support AI";

  return (
    <div className="flex justify-start py-2 px-4 animate-in fade-in-50 duration-300">
      <div className="flex gap-3 max-w-[85%] items-start">
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center mt-0.5 shadow-sm shadow-primary/10">
          <Bot size={15} className="text-primary animate-pulse" />
        </div>
        <div>
          <div className="text-[11px] font-semibold mb-1 text-muted-foreground flex items-center gap-1.5">
            <span>{botName}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
          </div>
          <div className="rounded-2xl rounded-tl-sm bg-gradient-to-r from-card to-card/90 border border-primary/20 px-4 py-2.5 shadow-sm">
            <div className="flex items-center gap-2">
              <Sparkles size={13} className="text-primary animate-spin [animation-duration:3s]" />
              <span className="text-xs font-medium text-foreground/90 tracking-wide bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text">
                AI is thinking & analyzing context
              </span>
              <div className="flex gap-1 items-center ml-1">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;