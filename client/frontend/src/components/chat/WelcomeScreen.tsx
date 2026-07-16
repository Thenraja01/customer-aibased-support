import { memo } from "react";
import { Headphones, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  onStartWithMessage: (message: string) => void;
  onOpenTicket: () => void;
}

const WelcomeScreen = memo(function WelcomeScreen({ onStartWithMessage, onOpenTicket }: WelcomeScreenProps) {
  const suggestions = [
    { label: "Get help with your account", message: "I need help with my account" },
    { label: "Report an issue", message: "I want to report an issue" },
    { label: "Billing questions", message: "I have a billing question" },
    { label: "General inquiry", message: "I have a general question" },
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-5 shadow-xl shadow-primary/20 animate-float">
        <Headphones className="w-8 h-8 text-primary-foreground" />
      </div>
      <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
        How can I help you today?
      </h2>
      <p className="text-sm text-muted-foreground mb-8 text-center max-w-sm">
        Ask questions, report issues, or get help with your account. Our AI assistant is here to assist.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-md w-full mb-6">
        {suggestions.map((s) => (
          <Button
            key={s.label}
            variant="outline"
            className="h-auto py-3 px-4 text-left text-sm justify-start rounded-xl dark:border-white/[0.06] dark:hover:bg-primary/10 dark:hover:border-primary/30 transition-all duration-200 hover:shadow-md hover:shadow-primary/10"
            onClick={() => onStartWithMessage(s.message)}
          >
            <span className="line-clamp-2">{s.label}</span>
          </Button>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={onOpenTicket}
        className="dark:hover:bg-primary/10 gap-2 text-muted-foreground"
      >
        <Plus size={16} />
        <span>Create a Support Ticket</span>
      </Button>
    </div>
  );
});

export default WelcomeScreen;
