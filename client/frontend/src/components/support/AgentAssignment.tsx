import React, { useState } from "react";
import { UserCheck, Users, ShieldAlert, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AgentAssignmentProps {
  currentAgentId?: string;
  currentAgentName?: string;
  agents: any[];
  onAssign: (agentId: string) => Promise<void>;
  disabled?: boolean;
}

export const AgentAssignment: React.FC<AgentAssignmentProps> = ({
  currentAgentId,
  currentAgentName = "Unassigned",
  agents = [],
  onAssign,
  disabled = false,
}) => {
  const [selectedAgent, setSelectedAgent] = useState(currentAgentId || "");
  const [loading, setLoading] = useState(false);

  const handleAssign = async () => {
    if (!selectedAgent || loading || disabled) return;
    setLoading(true);
    try {
      await onAssign(selectedAgent);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-card border rounded-2xl space-y-3 shadow-sm text-xs">
      <div className="flex items-center justify-between gap-2 border-b pb-2">
        <div className="flex items-center gap-2 font-bold text-sm">
          <UserCheck size={16} className="text-primary" />
          <span>Agent Assignment</span>
        </div>
        <span className="text-[11px] font-semibold text-muted-foreground">
          Assigned: <strong className="text-foreground">{currentAgentName}</strong>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <select
          value={selectedAgent}
          onChange={(e) => setSelectedAgent(e.target.value)}
          disabled={disabled || loading}
          className="flex-1 bg-background border rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="">Select Support Agent...</option>
          {agents.map((a) => (
            <option key={a._id} value={a._id}>
              👤 {a.name || a.username} ({a.activeChats || 0} active)
            </option>
          ))}
        </select>
        <Button
          onClick={handleAssign}
          disabled={disabled || loading || !selectedAgent}
          size="sm"
          className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold gap-1 shadow-sm shrink-0"
        >
          <ArrowRightLeft size={13} />
          {currentAgentId ? "Reassign" : "Assign"}
        </Button>
      </div>
    </div>
  );
};
