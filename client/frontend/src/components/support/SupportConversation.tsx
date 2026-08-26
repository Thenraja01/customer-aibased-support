import React, { useEffect, useRef } from "react";
import { Loader2, MessageCircle, Sparkles } from "lucide-react";
import { SupportChatHeader } from "./SupportChatHeader";
import { HandoffBanner } from "./HandoffBanner";
import { SupportMessage } from "./SupportMessage";
import { MessageComposer } from "./MessageComposer";
import { SupportPermissions, getRoleSupportPermissions } from "@/config/supportPermissions";

interface SupportConversationProps {
  role?: string;
  permissions?: SupportPermissions;
  conversation: any;
  messages: any[];
  currentUserId?: string;
  loading?: boolean;
  actionLoading?: boolean;
  onSendPublicMessage?: (text: string) => Promise<void>;
  onAddInternalNote?: (text: string) => Promise<void>;
  onResolve?: () => void;
  onEscalate?: () => void;
  onConvertToTicket?: () => void;
}

export const SupportConversation: React.FC<SupportConversationProps> = ({
  role = "support",
  permissions: customPermissions,
  conversation,
  messages,
  currentUserId,
  loading = false,
  actionLoading = false,
  onSendPublicMessage,
  onAddInternalNote,
  onResolve,
  onEscalate,
  onConvertToTicket,
}) => {
  const permissions = customPermissions || getRoleSupportPermissions(role);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!conversation) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-3 bg-background">
        <MessageCircle size={48} className="text-muted-foreground/30" />
        <div className="space-y-1">
          <h3 className="font-bold text-base">Select a Support Conversation</h3>
          <p className="text-xs text-muted-foreground max-w-sm">
            Choose an active chat session from the queue to view messages, SLA details, AI handoff context, and support actions.
          </p>
        </div>
      </div>
    );
  }

  const isCustomerView = role === "customer";
  const agentName = conversation.agent_id?.name || conversation.assigned_agent_name || "Unassigned";

  return (
    <div className="flex-1 flex flex-col bg-background min-w-0 h-full overflow-hidden">
      {/* Header */}
      <SupportChatHeader
        conversation={conversation}
        permissions={permissions}
        onResolve={onResolve}
        onEscalate={onEscalate}
        onConvertToTicket={onConvertToTicket}
        actionLoading={actionLoading}
      />

      {/* Message Timeline */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-3">
        {loading ? (
          <div className="p-8 text-center">
            <Loader2 size={24} className="animate-spin text-primary mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">Loading chat messages...</p>
          </div>
        ) : (
          <>
            {/* AI Handoff Card in timeline if conversation was escalated / handed off */}
            {(conversation.is_escalated || conversation.status === "escalated" || conversation.status === "HUMAN_QUEUED") && (
              <HandoffBanner
                summary={conversation.topic || conversation.ai_summary || "Customer requested live support."}
                reason={conversation.escalation_reason || "AI could not resolve / User requested live support."}
                assignedAgentName={agentName}
                timestamp={conversation.escalated_at || conversation.created_at}
              />
            )}

            {messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground">
                No messages yet in this support session.
              </div>
            ) : (
              messages.map((m, idx) => (
                <SupportMessage
                  key={m._id || idx}
                  message={m}
                  currentUserId={currentUserId}
                  isCustomerView={isCustomerView}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Composer Footer */}
      {!isCustomerView && onSendPublicMessage && onAddInternalNote && (
        <MessageComposer
          permissions={permissions}
          onSendPublicMessage={onSendPublicMessage}
          onAddInternalNote={onAddInternalNote}
          disabled={actionLoading || conversation.status === "closed"}
        />
      )}
    </div>
  );
};
