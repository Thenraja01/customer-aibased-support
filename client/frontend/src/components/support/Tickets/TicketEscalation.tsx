import { useState } from 'react';
import { Textarea } from '@/components/common/Forms/Textarea';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface TicketEscalationProps {
  ticketId: string;
  onEscalate: (ticketId: string, reason: string) => Promise<void>;
}

export function TicketEscalation({ ticketId, onEscalate }: TicketEscalationProps) {
  const [reason, setReason] = useState('');
  const [escalating, setEscalating] = useState(false);

  const handleEscalate = async () => {
    if (!reason.trim()) return;
    setEscalating(true);
    await onEscalate(ticketId, reason);
    setEscalating(false);
    setReason('');
  };

  return (
    <div className="space-y-3 p-4 border border-orange-200 dark:border-orange-900 rounded-lg bg-orange-50 dark:bg-orange-950/20">
      <div className="flex items-center gap-2 text-orange-600">
        <AlertTriangle size={16} />
        <span className="text-sm font-medium">Escalate Ticket</span>
      </div>
      <Textarea
        placeholder="Reason for escalation..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleEscalate}
        disabled={!reason.trim() || escalating}
        className="border-orange-300 text-orange-600 hover:bg-orange-100"
      >
        {escalating ? 'Escalating...' : 'Escalate'}
      </Button>
    </div>
  );
}
