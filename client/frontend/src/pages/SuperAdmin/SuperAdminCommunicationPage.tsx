import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Send, Check, CheckCheck, MessageCircle, Loader2, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommunicationAPI } from "@/api/communication.api";
import { AdminAPI } from "@/api/admin.api";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/toast";

interface OrgConversation {
  organization_id: string;
  organization_name: string;
  last_message: string;
  last_message_at: string;
  last_sender_name: string;
  message_count: number;
  unread_count: number;
}

interface Message {
  _id: string;
  sender_id: { _id: string; name: string; email: string };
  message: string;
  status: "sent" | "seen";
  seen_at: string | null;
  created_at: string;
}

export default function SuperAdminCommunicationPage() {
  const [orgs, setOrgs] = useState<OrgConversation[]>([]);
  const [allOrgs, setAllOrgs] = useState<any[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user } = useAuth();
  const toast = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedOrgId) {
      loadOrgMessages(selectedOrgId);
      markOrgSeen(selectedOrgId);
    }
  }, [selectedOrgId]);

  const loadData = async () => {
    try {
      const [orgsRes, allOrgsRes] = await Promise.all([
        CommunicationAPI.getOrgConversations(),
        AdminAPI.getOrganizations(),
      ]);
      if (orgsRes.data.success) setOrgs(orgsRes.data.data);
      if (allOrgsRes.data.success) setAllOrgs(allOrgsRes.data.data);
    } catch {
      toast.error("Error", "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  };

  const loadOrgMessages = async (orgId: string) => {
    try {
      const res = await CommunicationAPI.getOrgMessages(orgId);
      if (res.data.success) setMessages(res.data.data);
    } catch {
      toast.error("Error", "Failed to load messages");
    }
  };

  const markOrgSeen = async (orgId: string) => {
    try {
      await CommunicationAPI.markOrgSeen(orgId);
      setOrgs((prev) =>
        prev.map((o) =>
          o.organization_id === orgId ? { ...o, unread_count: 0 } : o
        )
      );
    } catch {}
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !selectedOrgId) return;
    setSending(true);
    try {
      const res = await CommunicationAPI.sendToOrg({
        organization_id: selectedOrgId,
        message: input.trim(),
      });
      if (res.data.success) {
        setMessages((prev) => [...prev, res.data.data]);
        setInput("");
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

  const filteredOrgs = orgs.filter((o) =>
    o.organization_name?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedOrgName =
    selectedOrgId &&
    (orgs.find((o) => o.organization_id === selectedOrgId)?.organization_name ||
      allOrgs.find((o) => o._id === selectedOrgId)?.name);

  const ChatSidebar = () => (
    <div className={cn("w-full md:w-80 lg:w-96 border-r dark:border-white/[0.06] flex flex-col bg-card dark:bg-card/50", sidebarOpen ? "flex" : "hidden md:flex")}>
      <div className="p-3 border-b dark:border-white/[0.06]">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search organizations..."
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-muted dark:bg-white/[0.04] border-0 focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filteredOrgs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <MessageCircle size={28} className="text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No conversations yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Send a message to an organization to start</p>
          </div>
        ) : (
          filteredOrgs.map((org) => {
            const isActive = org.organization_id === selectedOrgId;
            return (
              <button
                key={org.organization_id}
                onClick={() => { setSelectedOrgId(org.organization_id); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 dark:hover:bg-white/[0.03] border-b dark:border-white/[0.03]",
                  isActive && "bg-primary/5 dark:bg-primary/10"
                )}
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-primary">
                    {org.organization_name?.charAt(0)?.toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate">{org.organization_name || "Unknown Org"}</p>
                    {org.last_message_at && (
                      <p className="text-[10px] text-muted-foreground/60 shrink-0">
                        {new Date(org.last_message_at).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className="text-xs text-muted-foreground truncate">
                      {org.last_sender_name ? `${org.last_sender_name}: ` : ""}
                      {org.last_message}
                    </p>
                    {org.unread_count > 0 && (
                      <span className="shrink-0 w-5 h-5 rounded-full bg-primary text-[10px] font-medium text-primary-foreground flex items-center justify-center">
                        {org.unread_count > 9 ? "9+" : org.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] rounded-xl border dark:border-white/[0.06] overflow-hidden bg-card dark:bg-card/50">
      <ChatSidebar />

      <div className={cn("flex-1 flex flex-col", !sidebarOpen ? "flex" : "hidden md:flex")}>
        {selectedOrgId ? (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b dark:border-white/[0.06] bg-card">
              <button className="md:hidden p-1 rounded-lg hover:bg-muted" onClick={() => setSidebarOpen(true)}>
                <ChevronLeft size={18} />
              </button>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">
                  {selectedOrgName?.charAt(0)?.toUpperCase() || "?"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{selectedOrgName || "Organization"}</p>
                <p className="text-[11px] text-muted-foreground">Click to send a notification to org admins</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <MessageCircle size={32} className="text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No messages yet</p>
                  <p className="text-xs text-muted-foreground/60">Send a message to start the conversation</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id._id === user?._id;
                  const isSeen = msg.status === "seen";
                  return (
                    <div key={msg._id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[75%] rounded-xl px-4 py-2.5",
                          isMine
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted dark:bg-white/[0.06] rounded-bl-sm"
                        )}
                      >
                        {!isMine && (
                          <p className="text-[11px] font-medium mb-0.5 opacity-70">{msg.sender_id.name}</p>
                        )}
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.message}</p>
                        <div className={cn("flex items-center gap-1 mt-1", isMine ? "justify-end" : "justify-start")}>
                          <span className={cn("text-[10px]", isMine ? "text-primary-foreground/60" : "text-muted-foreground/60")}>
                            {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {isMine && (
                            isSeen ? (
                              <CheckCheck size={12} className="text-blue-400" />
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

            <div className="flex items-end gap-2 p-4 border-t dark:border-white/[0.06]">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="flex-1 rounded-lg border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none dark:border-white/[0.06]"
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 shrink-0 transition-colors"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle size={48} className="mx-auto text-muted-foreground/20 mb-3" />
              <h3 className="text-lg font-medium text-muted-foreground">Organization Communication</h3>
              <p className="text-sm text-muted-foreground/60 mt-1">Select an organization from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
