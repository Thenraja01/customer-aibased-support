import { useState, useEffect } from "react";
import { MessageSquare, Search, Eye, Clock, User, FileText, Loader2, Bot } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { ChatAPI, MessageAPI } from "@/api";

interface ChatDoc {
  _id: string;
  topic: string;
  status: string;
  created_at: string;
  createdAt?: string;
  user_id?: { name?: string; email?: string };
}

export default function ConversationsPage() {
  const toast = useToast();
  const [chats, setChats] = useState<ChatDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedChat, setSelectedChat] = useState<ChatDoc | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    setLoading(true);
    try {
      const res = await ChatAPI.getAll();
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch {
      toast.error("Error", "Failed to load customer conversations.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTranscript = async (chat: ChatDoc) => {
    setSelectedChat(chat);
    setLoadingMessages(true);
    try {
      const res = await MessageAPI.getByChat(chat._id);
      if (res.data.success) {
        setMessages(res.data.data);
      }
    } catch {
      toast.error("Error", "Failed to load conversation transcript.");
    } finally {
      setLoadingMessages(false);
    }
  };

  const filtered = chats.filter(
    (c) =>
      !search ||
      c.topic?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_id?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.user_id?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Customer Conversations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review past and active AI customer support conversations across your website project.
          </p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by conversation topic, customer, or keyword..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <div className="p-6 rounded-2xl bg-card border border-border/80 shadow-sm space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-sm gap-2">
            <Loader2 size={16} className="animate-spin text-primary" />
            Loading conversations...
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center border rounded-xl bg-muted/20">
            <MessageSquare size={32} className="mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-sm font-medium">No Conversations Found</p>
            <p className="text-xs text-muted-foreground mt-1">
              Conversations will appear here when visitors chat with your website widget.
            </p>
          </div>
        ) : (
          <div className="divide-y border rounded-xl overflow-hidden">
            {filtered.map((chat) => (
              <div
                key={chat._id}
                className="p-4 flex items-center justify-between hover:bg-muted/40 transition-colors gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 font-bold">
                    <MessageSquare size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{chat.topic || "Customer Inquiry"}</p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <User size={12} /> {chat.user_id?.name || "Website Visitor"}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(chat.created_at || chat.createdAt || Date.now()).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenTranscript(chat)}
                  className="px-3 py-1.5 rounded-lg border hover:bg-muted text-xs font-semibold flex items-center gap-1.5 transition-all shrink-0"
                >
                  <Eye size={14} /> View Transcript
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transcript Modal */}
      {selectedChat && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-2xl h-[600px] flex flex-col shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3 shrink-0">
              <div>
                <h3 className="font-bold text-base">{selectedChat.topic || "Conversation Transcript"}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  ID: #{selectedChat._id.slice(-8)} • {new Date(selectedChat.created_at || Date.now()).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedChat(null)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold"
              >
                &times;
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 my-2">
              {loadingMessages ? (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm gap-2">
                  <Loader2 size={16} className="animate-spin text-primary" />
                  Loading transcript messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground text-xs">No messages recorded in session.</div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m._id}
                    className={`flex gap-3 max-w-[85%] ${m.is_ai ? "mr-auto" : "ml-auto flex-row-reverse"}`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                        m.is_ai ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-primary text-primary-foreground font-bold"
                      }`}
                    >
                      {m.is_ai ? <Bot size={14} /> : <User size={14} />}
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        m.is_ai
                          ? "bg-muted/80 text-foreground border border-border/80 rounded-tl-xs"
                          : "bg-primary text-primary-foreground rounded-tr-xs"
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.content}</p>

                      {/* Clean Document Citations */}
                      {m.citations && m.citations.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-border/60 flex flex-wrap gap-1">
                          {m.citations.map((c: any, i: number) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background/60 border border-border text-[10px] text-muted-foreground font-medium"
                            >
                              📄 {c.documentName || "Document.pdf"}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedChat(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold border hover:bg-muted"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
