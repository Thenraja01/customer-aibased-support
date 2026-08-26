import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, Loader2, Check, CheckCheck, Building2, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunicationAPI } from "@/api/communication.api";
import BranchAPI from "@/api/branch.api.js";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

interface Message {
  _id: string;
  sender_id: { _id: string; name: string; email: string };
  message: string;
  scope?: "org_broadcast" | "branch_channel" | "direct";
  branch_id?: any;
  status: "sent" | "seen";
  seen_at: string | null;
  created_at: string;
}

export default function AdminCommunicationPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [activeChannel, setActiveChannel] = useState<"org" | "branch">("org");
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");

  const { user } = useAuth();
  const toast = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const roleName = user?.roleName || user?.role || "admin";
  const isOrgAdmin = roleName === "admin" || roleName === "super_admin";
  const isBranchAdmin = roleName === "branch_admin";
  const isSupport = roleName === "support";

  // If user is branch_admin or support, default active channel to their branch
  useEffect(() => {
    if (isBranchAdmin || isSupport) {
      setActiveChannel("branch");
      const userBranchId = user?.branch_id?._id || user?.branch_id || user?.branchId;
      if (userBranchId) setSelectedBranchId(String(userBranchId));
    }
  }, [roleName, user]);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load available branches for org admin selection
  useEffect(() => {
    if (isOrgAdmin) {
      BranchAPI.getAll()
        .then((res: any) => {
          if (res.data?.success) {
            const list = res.data.data || [];
            setBranches(list);
            if (list.length > 0 && !selectedBranchId) {
              setSelectedBranchId(list[0]._id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOrgAdmin]);

  useEffect(() => {
    loadMessages();
  }, [activeChannel, selectedBranchId]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      if (activeChannel === "branch") {
        const branchId = isOrgAdmin ? selectedBranchId : (user?.branch_id?._id || user?.branch_id || user?.branchId || selectedBranchId);
        if (branchId) {
          const res = await CommunicationAPI.getBranchMessages(branchId);
          if (res.data.success) {
            setMessages(res.data.data);
          }
          await CommunicationAPI.markBranchSeen(branchId);
        } else {
          setMessages([]);
        }
      } else {
        const res = await CommunicationAPI.getMyOrgMessages();
        if (res.data.success) {
          setMessages(res.data.data);
        }
        markAllAsSeen();
      }
    } catch {
      toast.error("Error", "Failed to load messages");
    } finally {
      setLoading(false);
    }
  };

  const currentUserId = user?._id || user?.userId;

  const markAllAsSeen = async () => {
    try {
      const orgId = user?.organization_id?._id || user?.organization_id;
      if (orgId) {
        await CommunicationAPI.markOrgSeen(orgId);
        setMessages((prev) =>
          prev.map((m) => {
            const senderIdStr = typeof m.sender_id === "object" ? m.sender_id?._id : m.sender_id;
            return senderIdStr !== currentUserId && m.status === "sent"
              ? { ...m, status: "seen" as const }
              : m;
          })
        );
      }
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      if (activeChannel === "branch") {
        const branchId = isOrgAdmin ? selectedBranchId : (user?.branch_id?._id || user?.branch_id || user?.branchId || selectedBranchId);
        if (!branchId) {
          toast.error("Error", "Please select a branch to send message");
          setSending(false);
          return;
        }
        const res = await CommunicationAPI.sendToBranch({
          branch_id: branchId,
          organization_id: user?.organization_id?._id || user?.organization_id,
          message: input.trim(),
        });
        if (res.data.success) {
          setMessages((prev) => [...prev, res.data.data]);
          setInput("");
        }
      } else {
        const res = await CommunicationAPI.sendToOrg({
          organization_id: user?.organization_id?._id || user?.organization_id,
          message: input.trim(),
        });
        if (res.data.success) {
          setMessages((prev) => [...prev, res.data.data]);
          setInput("");
        }
      }
    } catch {
      toast.error("Error", "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] rounded-xl border dark:border-white/[0.06] overflow-hidden bg-card shadow-sm">
      {/* Header & Channel Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-3.5 border-b dark:border-white/[0.06] bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            {activeChannel === "org" ? (
              <Radio size={20} className="text-primary" />
            ) : (
              <Building2 size={20} className="text-primary" />
            )}
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">
              {activeChannel === "org" ? "Organization Announcements & Broadcasts" : "Branch Team Channel"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {activeChannel === "org"
                ? "Organization-wide broadcasts visible to Admins and Branches"
                : "Internal branch communication between Branch Admins & Support Staff"}
            </p>
          </div>
        </div>

        {/* Channel Navigation Buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border">
            <Button
              variant={activeChannel === "org" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveChannel("org")}
              className="text-xs h-7 px-3 gap-1.5"
            >
              <Radio size={12} />
              Org Broadcast
            </Button>
            <Button
              variant={activeChannel === "branch" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveChannel("branch")}
              className="text-xs h-7 px-3 gap-1.5"
            >
              <Building2 size={12} />
              Branch Team
            </Button>
          </div>

          {/* Org Admin Branch Selector */}
          {isOrgAdmin && activeChannel === "branch" && branches.length > 0 && (
            <select
              value={selectedBranchId}
              onChange={(e) => setSelectedBranchId(e.target.value)}
              className="h-8 rounded-lg border bg-background px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary dark:border-white/[0.08]"
            >
              {branches.map((b) => (
                <option key={b._id} value={b._id}>
                  📍 {b.name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-muted/10">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <MessageCircle size={36} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm font-semibold text-foreground">No messages in this channel yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm">
              {activeChannel === "org"
                ? "Organization-wide announcements and updates will appear here."
                : "Messages between your branch admin and support staff will appear here."}
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const senderIdStr = typeof msg.sender_id === "object" ? msg.sender_id?._id : msg.sender_id;
            const senderName = typeof msg.sender_id === "object" ? msg.sender_id?.name || "User" : "User";
            const isMine = senderIdStr === currentUserId;
            const isSeen = msg.status === "seen";

            return (
              <div key={msg._id || `${msg.created_at || ""}-${idx}`} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2.5 shadow-2xs",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-xs"
                      : "bg-card border text-card-foreground rounded-bl-xs"
                  )}
                >
                  {!isMine && (
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-[11px] font-bold opacity-90">{senderName}</span>
                    </div>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{msg.message}</p>
                  <div className={cn("flex items-center gap-1 mt-1.5", isMine ? "justify-end" : "justify-start")}>
                    <span className={cn("text-[10px]", isMine ? "text-primary-foreground/70" : "text-muted-foreground")}>
                      {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMine && (
                      isSeen ? (
                        <CheckCheck size={12} className="text-blue-300" />
                      ) : (
                        <Check size={12} className="text-primary-foreground/60" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Composer */}
      <div className="flex items-end gap-2 p-4 border-t dark:border-white/[0.06] bg-card">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={activeChannel === "org" ? "Broadcast message to all organization staff..." : "Send internal message to branch team..."}
          rows={1}
          className="flex-1 rounded-xl border bg-background px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none dark:border-white/[0.08]"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="p-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0 transition-colors cursor-pointer"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
