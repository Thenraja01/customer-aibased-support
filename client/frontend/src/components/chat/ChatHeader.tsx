import { memo, useMemo, useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Bot, History, Plus, XCircle, ArrowLeft, Cpu, Database, CheckCircle2, AlertTriangle, LifeBuoy } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useSocket } from "@/context/SocketContext";
import { useAuthContext } from "@/context/AuthContext";
import { useChat } from "@/hooks/useChat";
import type { Chat } from "@/types/chat";
import DocumentAPI from "@/api/document.api.js";

interface ChatHeaderProps {
  activeChat: Chat | null;
  isSupportView?: boolean;
  onBack?: () => void;
  onOpenEscalation?: () => void;
}

const ChatHeader = memo(function ChatHeader({ activeChat, isSupportView, onBack, onOpenEscalation }: ChatHeaderProps) {
  const navigate = useNavigate();
  const { user, orgSettings } = useAuthContext();
  const { typingUsers } = useSocket();
  const { endChat, loadUserChats } = useChat();
  const isNew = !activeChat;
  const isClosed = activeChat?.status === "closed";
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmTitle, setConfirmTitle] = useState("");
  const [confirmMessage, setConfirmMessage] = useState("");

  // KB Status dynamic state from real API
  const [kbStatus, setKbStatus] = useState<{ status: "healthy" | "processing" | "warning" | "empty"; count: number }>({
    status: "healthy",
    count: 0,
  });

  useEffect(() => {
    let isMounted = true;
    async function fetchKBStats() {
      try {
        const res = await DocumentAPI.getAll();
        const docs = res.data?.data || res.data || [];
        if (!isMounted) return;
        if (!Array.isArray(docs) || docs.length === 0) {
          setKbStatus({ status: "empty", count: 0 });
          return;
        }
        const approvedCount = docs.filter((d: any) => 
          d.status === "published" || 
          d.status === "approved" || 
          d.status === "ready_for_review" || 
          d.status === "completed" || 
          d.status === "uploaded"
        ).length;
        const processingCount = docs.filter((d: any) => d.status === "processing" || d.ingestionStatus === "processing").length;
        const failedCount = docs.filter((d: any) => d.status === "needs_revision" || d.ingestionStatus === "failed").length;

        if (processingCount > 0) {
          setKbStatus({ status: "processing", count: processingCount });
        } else if (failedCount > 0) {
          setKbStatus({ status: "warning", count: failedCount });
        } else {
          setKbStatus({ status: "healthy", count: approvedCount });
        }
      } catch {
        if (isMounted) {
          setKbStatus({ status: "healthy", count: 0 });
        }
      }
    }
    fetchKBStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const isTyping = useMemo(() => {
    if (!activeChat?._id || !user?._id) return false;
    return Object.keys(typingUsers).some((key) =>
      key.startsWith(`${activeChat._id}:`) && !key.endsWith(user._id)
    );
  }, [typingUsers, activeChat?._id, user?._id]);

  const handleEndChat = useCallback(() => {
    if (!activeChat?._id) return;
    setConfirmTitle("End Conversation");
    setConfirmMessage("Are you sure you want to conclude this active session? The transcript will be archived.");
    setConfirmAction(() => async () => {
      try {
        await endChat(activeChat._id);
        loadUserChats();
      } catch (err) {
        console.error(err);
      }
    });
    setConfirmOpen(true);
  }, [activeChat, endChat, loadUserChats]);

  const isTyping = useMemo(() => {
    if (!activeChat?._id || !user?._id) return false;
    return Object.keys(typingUsers).some((key) =>
      key.startsWith(`${activeChat._id}:`) && !key.endsWith(user._id)
    );
  }, [typingUsers, activeChat?._id, user?._id]);

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border/80 px-4 sm:px-6 py-3 bg-card/90 backdrop-blur-xl shrink-0 select-none shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="p-2 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground shrink-0 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          {/* AI Avatar */}
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary/30 via-emerald-500/20 to-teal-500/10 border border-primary/30 flex items-center justify-center shadow-md">
              <Bot size={20} className="text-primary animate-pulse" />
            </div>
            {/* Beacon Dot */}
            <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isClosed ? "bg-muted-foreground" : isTyping ? "bg-cyan-400" : "bg-emerald-400"
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-3 w-3 border-2 border-card ${
                  isClosed ? "bg-muted-foreground" : isTyping ? "bg-cyan-400" : "bg-emerald-500"
                }`}
              />
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-sm font-bold leading-tight truncate">
                {isSupportView
                  ? `Session with ${(activeChat?.user_id as any)?.name || "Customer"}`
                  : (orgSettings?.chatbot_name || "Support AI Copilot")}
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold inline-flex items-center gap-1">
                <Cpu size={10} /> v2.4 Turbo
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
              {isClosed ? (
                <span className="text-muted-foreground">Session Closed</span>
              ) : isTyping ? (
                <span className="text-cyan-400 font-medium animate-pulse">AI is generating response...</span>
              ) : (
                <span className="text-emerald-500 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Ready
                </span>
              )}

              <span className="text-muted-foreground/40">•</span>

              {/* Dynamic KB Status */}
              <div className="inline-flex items-center gap-1 text-[10.5px]">
                {kbStatus.status === "healthy" && (
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 size={11} /> {kbStatus.count} approved docs
                  </span>
                )}
                {kbStatus.status === "processing" && (
                  <span className="text-amber-500 font-medium flex items-center gap-1 animate-pulse">
                    <Database size={11} /> {kbStatus.count} indexing
                  </span>
                )}
                {kbStatus.status === "warning" && (
                  <span className="text-rose-500 font-medium flex items-center gap-1">
                    <AlertTriangle size={11} /> KB needs attention
                  </span>
                )}
                {kbStatus.status === "empty" && (
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Database size={11} /> No approved docs
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 bg-muted/40 dark:bg-neutral-900/60 backdrop-blur-md p-1 rounded-2xl border border-border/60 shadow-sm">
          {/* History */}
          <button
            type="button"
            onClick={() => navigate(isSupportView ? "/support/chat-history" : "/chat-history")}
            title="View Chat History"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-card/80 transition-all active:scale-95"
            aria-label="Chat History"
          >
            <History size={14} className="text-emerald-500" />
            <span className="hidden md:inline">History</span>
          </button>

          {/* Escalate */}
          {!isClosed && activeChat && onOpenEscalation && !isSupportView && (
            <button
              type="button"
              onClick={onOpenEscalation}
              title="Escalate to Human Support"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all active:scale-95"
              aria-label="Escalate to Ticket"
            >
              <LifeBuoy size={14} />
              <span className="hidden md:inline">Escalate</span>
            </button>
          )}

          {/* End Chat */}
          {!isClosed && activeChat && (
            <button
              type="button"
              onClick={handleEndChat}
              title="Conclude Active Session"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-rose-500 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all active:scale-95"
              aria-label="End Chat"
            >
              <XCircle size={14} />
              <span className="hidden md:inline">End Chat</span>
            </button>
          )}

          {/* Vertical Separator */}
          {!isSupportView && (
            <div className="w-[1px] h-4 bg-border/60 mx-0.5" />
          )}

          {/* New Ticket */}
          {!isSupportView && (
            <button
              type="button"
              onClick={() => navigate("/tickets")}
              title="Create Support Ticket"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:brightness-110 shadow-sm transition-all active:scale-95"
              aria-label="New Ticket"
            >
              <Plus size={14} />
              <span>New Ticket</span>
            </button>
          )}
        </div>
      </header>

      <ConfirmDialog
        open={confirmOpen}
        title={confirmTitle}
        message={confirmMessage}
        variant="warning"
        onConfirm={() => {
          confirmAction?.();
          setConfirmOpen(false);
        }}
        onCancel={() => {
          setConfirmOpen(false);
          setConfirmAction(null);
        }}
      />
    </>
  );
});

export default ChatHeader;

