import React from "react";
import { Sparkles, UserCheck, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface HandoffBannerProps {
  summary?: string;
  reason?: string;
  assignedAgentName?: string;
  timestamp?: string;
}

export const HandoffBanner: React.FC<HandoffBannerProps> = ({
  summary = "Customer requested live human support assistance.",
  reason = "AI confidence threshold / user requested human agent",
  assignedAgentName = "Unassigned",
  timestamp,
}) => {
  return (
    <div className="my-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-950 dark:text-amber-200 shadow-sm space-y-2">
      <div className="flex items-center justify-between gap-2 border-b border-amber-500/20 pb-2">
        <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
          <Sparkles size={16} className="text-amber-500 animate-pulse" />
          <span>🤖 AI HANDOFF EVENT</span>
        </div>
        {timestamp && (
          <span className="text-[10px] text-muted-foreground font-mono">
            {new Date(timestamp).toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="space-y-1 text-xs">
        <p className="font-semibold text-foreground">
          Customer requested human support.
        </p>

        <div className="bg-background/60 p-2.5 rounded-xl border border-amber-500/20 text-xs">
          <span className="font-bold text-amber-600 dark:text-amber-400 block text-[10px] uppercase mb-0.5">
            AI Summary
          </span>
          <p className="text-foreground">{summary}</p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px]">
          <span className="text-muted-foreground">
            <strong>Reason:</strong> {reason}
          </span>
          <Badge variant="outline" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold border-amber-500/30">
            <UserCheck size={12} className="mr-1 inline" />
            Assigned to: {assignedAgentName}
          </Badge>
        </div>
      </div>
    </div>
  );
};
