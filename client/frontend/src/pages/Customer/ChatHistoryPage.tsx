import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChatAPI } from "@/api";
import { MessageSquare, Clock, Trash2, Eye } from "lucide-react";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface Chat {
  _id: string;
  topic: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function ChatHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChats();
  }, [user]);

  const loadChats = async () => {
    if (!user?._id) return;
    try {
      const res = await ChatAPI.getByUser(user._id);
      if (res.data.success) {
        setChats(res.data.data);
      }
    } catch (error) {
      console.error("Failed to load chat history:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (chatId: string) => {
    if (!confirm("Are you sure you want to delete this chat?")) return;
    try {
      await ChatAPI.delete(chatId);
      setChats(chats.filter((chat) => chat._id !== chatId));
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleView = (chatId: string) => {
    navigate(`/chat`, { state: { chatId } });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
      case "closed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading chat history...</div>
      </div>
    );
  }

  return (
    <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={staggerItem} className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Chat History</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your past chat sessions with the AI assistant.
        </p>
      </motion.div>

      <motion.div variants={staggerItem} className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] overflow-hidden">
        <div className="px-6 py-4 border-b dark:border-white/[0.06] flex items-center justify-between">
          <h3 className="text-sm font-medium">Past Conversations</h3>
          <button
            onClick={() => navigate("/chat")}
            className="text-xs text-primary hover:underline"
          >
            Start New Chat
          </button>
        </div>
        {chats.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No chat history yet.</p>
            <button
              onClick={() => navigate("/chat")}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm hover:opacity-90"
            >
              Start Your First Chat
            </button>
          </div>
        ) : (
          <div className="divide-y dark:divide-white/[0.04]">
            {chats.map((chat) => (
              <div key={chat._id} className="px-6 py-4 flex items-center justify-between hover:bg-muted/50 dark:hover:bg-white/[0.03] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <MessageSquare size={18} className="text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{chat.topic || "Support Chat"}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock size={12} className="text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        {new Date(chat.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-md ${getStatusColor(chat.status)}`}>
                    {chat.status}
                  </span>
                  <button
                    onClick={() => handleView(chat._id)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                    title="View Chat"
                  >
                    <Eye size={16} className="text-muted-foreground" />
                  </button>
                  <button
                    onClick={() => handleDelete(chat._id)}
                    className="p-2 hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Delete Chat"
                  >
                    <Trash2 size={16} className="text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
