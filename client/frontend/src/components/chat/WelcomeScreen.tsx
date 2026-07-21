import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatInput from "./ChatInput";

interface WelcomeScreenProps {
  onStartWithMessage: (message: string) => void;
}

const WelcomeScreen = memo(function WelcomeScreen({ onStartWithMessage }: WelcomeScreenProps) {
  const navigate = useNavigate();

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

      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate("/tickets")}
        className="dark:hover:bg-primary/10 gap-2 text-muted-foreground"
      >
        <Plus size={16} />
        <span>Create a Support Ticket</span>
      </Button>
      <ChatInput
          onSend={(text) => {
    console.log("WelcomeScreen onSend", text);
    onStartWithMessage(text);
  }}
      />
    </div>
  );
});

export default WelcomeScreen;
