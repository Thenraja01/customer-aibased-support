import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/common/Forms/Select';
import { UserCheck } from 'lucide-react';

interface TicketAssignmentProps {
  currentAssignee?: string;
  agents: { _id: string; name: string }[];
  onAssign: (agentId: string) => Promise<void>;
}

export function TicketAssignment({ currentAssignee, agents, onAssign }: TicketAssignmentProps) {
  const [selected, setSelected] = useState(currentAssignee || '');
  const [assigning, setAssigning] = useState(false);

  const handleAssign = async () => {
    if (!selected) return;
    setAssigning(true);
    await onAssign(selected);
    setAssigning(false);
  };

  return (
    <div className="flex items-end gap-2">
      <div className="flex-1">
        <Select
          label="Assign to"
          options={[
            { label: 'Select agent...', value: '' },
            ...agents.map((a) => ({ label: a.name, value: a._id })),
          ]}
          value={selected}
          onChange={(e: any) => setSelected(e.target.value)}
        />
      </div>
      <Button onClick={handleAssign} disabled={!selected || assigning} size="sm">
        <UserCheck size={14} className="mr-1" />
        {assigning ? '...' : 'Assign'}
      </Button>
    </div>
  );
}
