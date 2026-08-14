import { useState, useEffect, memo } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, Plus, ArrowRight, RefreshCw, CreditCard, User, HelpCircle, Truck, Lock, Wrench, Package, Shield } from "lucide-react";
import ChatInput from "./ChatInput";
import { useAuth } from "@/hooks/useAuth";
import { ChatAPI } from "@/api/chat.api";

interface WelcomeScreenProps {
  onStartWithMessage: (message: string) => void;
}

const iconMap: Record<string, any> = {
  refund: RefreshCw,
  billing: CreditCard,
  account: User,
  support: HelpCircle,
  shipping: Truck,
  password: Lock,
  technical: Wrench,
  orders: Package,
  warranty: Shield,
  // Alternative keys matching the prompt:
  truck: Truck,
  "credit-card": CreditCard,
  user: User,
  "help-circle": HelpCircle,
  refresh: RefreshCw,
  package: Package,
  shield: Shield,
  lock: Lock,
};

const WelcomeScreen = memo(function WelcomeScreen({ onStartWithMessage }: WelcomeScreenProps) {
  const navigate = useNavigate();
  const { orgSettings } = useAuth();
  const greeting = orgSettings?.greeting_message || "How can I help you today?";
  const botName = orgSettings?.chatbot_name || "Support Assistant";

  const [suggestedPrompts, setSuggestedPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchQuickActions = async () => {
      try {
        const res = await ChatAPI.getQuickActions();
        if (active && res.data?.success && Array.isArray(res.data.quickActions)) {
          setSuggestedPrompts(res.data.quickActions);
        }
      } catch (err) {
        console.error("Failed to load quick actions:", err);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchQuickActions();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 overflow-y-auto">
      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-6 shadow-lg shadow-primary/20">
        <Sparkles className="w-7 h-7 text-white" />
      </div>

      <h2 className="text-2xl font-bold mb-2 text-foreground text-center">
      {greeting}
      </h2>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-md leading-relaxed">
        {loading || suggestedPrompts.length > 0 
          ? "Ask questions, report issues, or select a quick action below."
          : "Ask a question about your account, billing, orders, or support."}
        <br />
        <span className="text-foreground/70 font-medium">{botName}</span> is here to assist.
      </p>

      {/* Suggested prompts loading skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8 max-w-lg w-full">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 px-4 py-3.5 rounded-lg border border-border bg-card animate-pulse"
              aria-hidden="true"
            >
              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center" />
              <div className="h-3 w-16 bg-muted rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Suggested prompts */}
      {!loading && suggestedPrompts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-8 max-w-lg w-full">
          {suggestedPrompts.slice(0, 4).map((prompt) => {
            const Icon = iconMap[prompt.icon] || HelpCircle;
            return (
              <button
                key={prompt.label}
                type="button"
                onClick={() => onStartWithMessage(prompt.query)}
                aria-label={`Select quick action: ${prompt.label}`}
                className="flex flex-col items-center gap-2 px-4 py-3.5 rounded-lg border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all duration-200 group animate-in fade-in slide-in-from-bottom-2 duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <Icon size={16} className="text-primary" />
                </div>
                <span className="text-xs font-medium text-muted-foreground group-hover:text-foreground transition-colors text-center truncate w-full">
                  {prompt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Create ticket shortcut */}
      <button
        type="button"
        onClick={() => navigate("/tickets")}
        className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors mb-6 group"
      >
        <Plus size={14} />
        <span>Create a Support Ticket</span>
        <ArrowRight size={12} className="opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
      </button>

      {/* Chat input */}
      <div className="w-full max-w-2xl">
        <ChatInput
          onSend={(text) => onStartWithMessage(text)}
        />
      </div>
    </div>
  );
});

export default WelcomeScreen;
