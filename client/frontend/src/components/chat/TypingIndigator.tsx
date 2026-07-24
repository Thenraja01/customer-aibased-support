import { memo } from "react";
import { Headphones } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const TypingIndicator = memo(function TypingIndicator() {
  const { orgSettings } = useAuth();
  const botName = orgSettings?.chatbot_name || "Support Assistant";

  return (
    <div className="w-full bg-background">
      <div className="max-w-3xl mx-auto px-4 py-3">
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-sm shadow-primary/20">
            <Headphones size={14} className="text-primary-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">{botName}</div>
            <div className="flex gap-1.5 items-center py-2">
              <span className="w-2 h-2 rounded-full bg-primary/50 dark:bg-primary/70 animate-bounce [animation-delay:0ms]" />
              <span className="w-2 h-2 rounded-full bg-primary/50 dark:bg-primary/70 animate-bounce [animation-delay:150ms]" />
              <span className="w-2 h-2 rounded-full bg-primary/50 dark:bg-primary/70 animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default TypingIndicator;