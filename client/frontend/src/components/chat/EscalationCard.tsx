import { MessageSquare, Ticket, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EscalationCardProps {
  onChatWithSupport: () => void;
  onRaiseTicket: () => void;
  loading?: boolean;
}

export default function EscalationCard({
  onChatWithSupport,
  onRaiseTicket,
  loading = false,
}: EscalationCardProps) {
  return (
    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 max-w-xl mx-auto my-4 space-y-3 shadow-md animate-in fade-in zoom-in-95">
      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wider">
        <AlertCircle size={15} />
        Need More Help?
      </div>
      <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
        I couldn't confidently resolve this question using our verified knowledge base. Would you like assistance from our support team?
      </p>
      <div className="flex items-center gap-3 pt-1">
        <Button
          onClick={onChatWithSupport}
          disabled={loading}
          size="sm"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <MessageSquare size={14} />
          Chat with Support
        </Button>
        <Button
          onClick={onRaiseTicket}
          disabled={loading}
          variant="outline"
          size="sm"
          className="border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20 text-xs font-semibold gap-1.5 transition-all"
        >
          <Ticket size={14} />
          Raise a Ticket
        </Button>
      </div>
    </div>
  );
}
