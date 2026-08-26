import React from "react";
import {
  User,
  Eye,
  CheckCircle2,
  Ticket,
  AlertTriangle,
  Building2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SLAIndicator } from "./SLAIndicator";
import { SupportPermissions } from "@/config/supportPermissions";

interface SupportChatHeaderProps {
  conversation: any;
  permissions: SupportPermissions;
  onResolve?: () => void;
  onEscalate?: () => void;
  onConvertToTicket?: () => void;
  actionLoading?: boolean;
}

export const SupportChatHeader: React.FC<SupportChatHeaderProps> = ({
  conversation,
  permissions,
  onResolve,
  onEscalate,
  onConvertToTicket,
  actionLoading = false,
}) => {
  if (!conversation) return null;

  const customerName =
    conversation.user_id?.name ||
    conversation.customer_name ||
    `Customer #${conversation._id?.slice(-6)}`;
  const customerEmail = conversation.user_id?.email || conversation.customer_email || "";
  const branchName = conversation.branch_id?.name || conversation.branch_name || "";
  const assignedAgent = conversation.agent_id?.name || "Unassigned";

  return (
    <div className="border-b bg-card/60 backdrop-blur shrink-0">
      {/* Monitoring Banner if Admin Monitoring Mode */}
      {permissions.monitorChat && !permissions.replyToCustomer && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-1.5 flex items-center justify-between text-xs text-amber-950 dark:text-amber-200 font-semibold">
          <div className="flex items-center gap-2">
            <Eye size={14} className="text-amber-500 animate-pulse" />
            <span>
              👁️ ADMIN MONITORING MODE — Viewing conversation in supervisory read-only state.
            </span>
          </div>
          <Badge variant="outline" className="text-[10px] bg-amber-500/20 border-amber-500/30">
            Supervisory Audit
          </Badge>
        </div>
      )}

      {/* Main Header Bar */}
      <div className="p-4 flex flex-wrap items-center justify-between gap-4">
        {/* Customer & Conversation Info */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary shrink-0">
            <User size={18} />
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-bold text-sm truncate">{customerName}</h2>
              <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
              {branchName && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  <Building2 size={10} />
                  {branchName}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {customerEmail ? `${customerEmail} · ` : ""}
              Agent: <strong className="text-foreground">{assignedAgent}</strong>
            </p>
          </div>
        </div>

        {/* Right side: SLA & Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <SLAIndicator createdAt={conversation.created_at} compact />

          {permissions.escalateChat && onEscalate && (
            <Button
              onClick={onEscalate}
              disabled={actionLoading || conversation.is_escalated}
              variant="outline"
              size="sm"
              className="border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 text-xs font-semibold gap-1 h-8"
            >
              <AlertTriangle size={13} />
              {conversation.is_escalated ? "Escalated" : "Escalate"}
            </Button>
          )}

          {permissions.convertToTicket && onConvertToTicket && (
            <Button
              onClick={onConvertToTicket}
              disabled={actionLoading || conversation.status === "CONVERTED_TO_TICKET"}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs gap-1 h-8 shadow-sm"
            >
              <Ticket size={13} />
              Convert to Ticket
            </Button>
          )}

          {onResolve && (
            <Button
              onClick={onResolve}
              disabled={actionLoading || conversation.status === "closed"}
              variant="outline"
              size="sm"
              className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold gap-1 h-8"
            >
              <CheckCircle2 size={13} />
              Resolve
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
