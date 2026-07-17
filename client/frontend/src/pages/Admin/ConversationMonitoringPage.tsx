import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MessageSquare,
  Search,
  RefreshCw,
  Eye,
  Clock,
  User,
  Hash,
  Activity,
  ArrowLeft,
  Radio,
} from "lucide-react";
import { staggerContainer, staggerItem, scaleIn } from "@/lib/animations";
import { ChatAPI, MessageAPI } from "@/api";
import { cn } from "@/lib/utils";

interface ActiveChat {
  _id: string;
  topic?: string;
  status: "active" | "closed";
  user_id?: { _id: string; name: string; email: string };
  created_at: string;
  updated_at: string;
  messageCount: number;
  organization_id?: { _id: string; name: string };
}

interface ChatMessage {
  _id: string;
  content: string;
  role: "user" | "assistant" | "system";
  created_at: string;
  sender_id?: { name: string };
}

export default function ConversationMonitoringPage() {
  const [chats, setChats] = useState<ActiveChat[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "closed">("active");
  const [search, setSearch] = useState("");
  const [viewingChat, setViewingChat] = useState<ActiveChat | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [liveIndicator, setLiveIndicator] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadChats = useCallback(async () => {
    try {
      const res = await ChatAPI.getAll({ status: statusFilter !== "all" ? statusFilter : undefined });
      if (res.data.success) {
        const data = Array.isArray(res.data.data) ? res.data.data : [];
        setChats(
          data.map((c: any) => ({
            ...c,
            messageCount: c.message_count || c.messages?.length || 0,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  const loadMessages = useCallback(async (chatId: string) => {
    setLoadingMessages(true);
    try {
      const res = await MessageAPI.getByChat(chatId);
      if (res.data.success) {
        setMessages(Array.isArray(res.data.data) ? res.data.data : []);
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadChats();
  }, [loadChats]);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      loadChats();
      if (viewingChat) {
        loadMessages(viewingChat._id);
      }
      setLiveIndicator((prev) => !prev);
    }, 10000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [loadChats, loadMessages, viewingChat]);

  useEffect(() => {
    if (viewingChat) {
      loadMessages(viewingChat._id);
    }
  }, [viewingChat, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filtered = chats.filter((c) => {
    const matchSearch =
      c.topic?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_id?.email?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const activeCount = chats.filter((c) => c.status === "active").length;
  const closedCount = chats.filter((c) => c.status === "closed").length;

  function getDuration(chat: ActiveChat) {
    const start = new Date(chat.created_at).getTime();
    const end = chat.updated_at ? new Date(chat.updated_at).getTime() : Date.now();
    const ms = end - start;
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`;
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m`;
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
  }

  function timeAgo(dateStr: string) {
    const ms = Date.now() - new Date(dateStr).getTime();
    if (ms < 60000) return "just now";
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
    if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
    return `${Math.floor(ms / 86400000)}d ago`;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {!viewingChat ? (
        <>
          <motion.div variants={staggerItem} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Conversation Monitoring</h1>
              <p className="text-muted-foreground">Monitor live and recent conversations across the platform.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("w-2 h-2 rounded-full bg-green-500", liveIndicator ? "opacity-100" : "opacity-40")} />
                Live (10s refresh)
              </div>
              <Button variant="outline" size="sm" onClick={loadChats}>
                <RefreshCw size={14} className="mr-1" /> Refresh
              </Button>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="grid gap-4 md:grid-cols-3">
            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.3 }}
              className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Chats</p>
                  <p className="text-2xl font-bold mt-2">{activeCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center">
                  <Radio size={20} className="text-green-500" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.3 }}
              className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Closed Chats</p>
                  <p className="text-2xl font-bold mt-2">{closedCount}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
                  <MessageSquare size={20} className="text-muted-foreground" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={scaleIn}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.3 }}
              className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Conversations</p>
                  <p className="text-2xl font-bold mt-2">{chats.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                  <Activity size={20} className="text-primary" />
                </div>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={staggerItem} className="flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by topic, user..."
                className="pl-9"
              />
            </div>
            <div className="flex gap-1">
              {(["all", "active", "closed"] as const).map((s) => (
                <Button
                  key={s}
                  variant={statusFilter === s ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(s)}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Button>
              ))}
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
            {loading ? (
              <div className="text-center py-12 text-muted-foreground">Loading conversations...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Last Activity</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                        <MessageSquare size={32} className="mx-auto text-muted-foreground/40 mb-2" />
                        <p className="text-muted-foreground">No conversations found.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((chat) => (
                      <TableRow key={chat._id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
                              <User size={14} className="text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{chat.user_id?.name || "Anonymous"}</p>
                              <p className="text-xs text-muted-foreground">{chat.user_id?.email || "—"}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm">{chat.topic || "General"}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Hash size={12} className="text-muted-foreground" />
                            {chat.messageCount}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock size={12} />
                            {getDuration(chat)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="text-xs text-muted-foreground">
                            {chat.updated_at ? timeAgo(chat.updated_at) : "—"}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={chat.status === "active" ? "default" : "outline"}
                            className={cn(
                              "capitalize",
                              chat.status === "active" && "bg-green-500/10 text-green-500 border-green-500/20"
                            )}
                          >
                            {chat.status === "active" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1" />
                            )}
                            {chat.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingChat(chat)}
                          >
                            <Eye size={14} className="mr-1" /> View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </motion.div>
        </>
      ) : (
        <>
          <motion.div variants={staggerItem} className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => { setViewingChat(null); setMessages([]); }}>
              <ArrowLeft size={16} className="mr-1" /> Back
            </Button>
            <div>
              <h1 className="text-lg font-bold">{viewingChat.topic || "General Conversation"}</h1>
              <p className="text-sm text-muted-foreground">
                {viewingChat.user_id?.name || "Anonymous"} •{" "}
                <Badge variant={viewingChat.status === "active" ? "default" : "outline"} className="capitalize">
                  {viewingChat.status}
                </Badge>
              </p>
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-4">
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4 pb-3 border-b dark:border-white/[0.06]">
              <span className="flex items-center gap-1"><Hash size={12} /> {messages.length} messages</span>
              <span className="flex items-center gap-1"><Clock size={12} /> Started {new Date(viewingChat.created_at).toLocaleString()}</span>
              <span className="flex items-center gap-1"><User size={12} /> {viewingChat.user_id?.email || "—"}</span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
              {loadingMessages ? (
                <div className="text-center py-8 text-muted-foreground text-sm">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">No messages in this conversation.</div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    className={cn(
                      "flex",
                      msg.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[75%] rounded-xl px-4 py-2.5 text-sm",
                        msg.role === "user"
                          ? "bg-primary text-primary-foreground rounded-br-sm"
                          : "bg-muted rounded-bl-sm"
                      )}
                    >
                      {msg.role === "assistant" && msg.sender_id?.name && (
                        <p className="text-xs font-medium mb-1 opacity-70">{msg.sender_id.name}</p>
                      )}
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      <p
                        className={cn(
                          "text-[10px] mt-1.5",
                          msg.role === "user"
                            ? "text-primary-foreground/60 text-right"
                            : "text-muted-foreground"
                        )}
                      >
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>

          <motion.div variants={staggerItem} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-4">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Radio size={12} className="text-green-500" />
              <span>Monitoring mode — auto-refreshes every 10 seconds</span>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
