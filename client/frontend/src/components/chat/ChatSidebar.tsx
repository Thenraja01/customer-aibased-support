"use client";

import { useState, useMemo, useCallback } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, MessageCircle, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { RootState } from "@/store/store";
import type { Chat } from "@/types/chat";
import { staggerContainer, staggerItem } from "@/lib/animations";

interface ChatSidebarProps {
  onSelectChat: (chat: Chat) => void;
  onNewChat: () => void;
}

export default function ChatSidebar({ onSelectChat, onNewChat }: ChatSidebarProps) {
  const { chats, activeChat, loading } = useSelector((state: RootState) => state.chat);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return chats;
    const q = search.toLowerCase();
    return chats.filter(
      (c: Chat) =>
        c.topic?.toLowerCase().includes(q) ||
        c.status?.toLowerCase().includes(q)
    );
  }, [chats, search]);

  const formatTime = useCallback((date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }, []);

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-3 border-b dark:border-white/[0.06]">
        <Button
          onClick={onNewChat}
          className="w-full gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/20"
          size="sm"
        >
          <Plus size={16} />
          New Chat
        </Button>
      </div>

      <div className="px-3 pt-3 pb-1">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations..."
            className="pl-8 h-8 text-xs rounded-lg"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-1">
        {loading && chats.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <MessageCircle size={20} className="text-muted-foreground/50" />
            <p className="text-xs text-muted-foreground">
              {search ? "No matching conversations" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="space-y-0.5"
          >
            <AnimatePresence mode="popLayout">
              {filtered.map((chat: Chat) => {
                const isActive = activeChat?._id === chat._id;
                return (
                  <motion.button
                    key={chat._id}
                    variants={staggerItem}
                    layout
                    onClick={() => onSelectChat(chat)}
                    className={cn(
                      "w-full text-left px-3 py-2.5 rounded-xl transition-all duration-150 group",
                      isActive
                        ? "bg-primary/10 dark:bg-primary/15 border border-primary/20"
                        : "hover:bg-muted/60 dark:hover:bg-white/[0.04] border border-transparent"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-xs font-medium truncate",
                            isActive ? "text-primary" : "text-foreground"
                          )}
                        >
                          {chat.topic || "Untitled Chat"}
                        </p>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span
                            className={cn(
                              "w-1.5 h-1.5 rounded-full shrink-0",
                              chat.status === "open" ? "bg-green-500" : "bg-muted-foreground/40"
                            )}
                          />
                          <p className="text-[10px] text-muted-foreground truncate">
                            {chat.status === "open" ? "Open" : "Closed"}
                          </p>
                          <span className="text-[10px] text-muted-foreground/60">·</span>
                          <p className="text-[10px] text-muted-foreground/70 shrink-0">
                            {formatTime(chat.updated_at || chat.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </div>
  );
}
