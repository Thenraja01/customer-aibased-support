import React, { useState } from "react";
import { Plus, Search, MessageSquare, Pin, Trash2, Edit2, Check, X, Sparkles } from "lucide-react";
import { AIConversationItem } from "@/api/ai.api";
import { cn } from "@/lib/utils";

interface AISidebarProps {
  conversations: AIConversationItem[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onUpdateConversation: (id: string, updates: Partial<AIConversationItem>) => void;
  onDeleteConversation: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const AISidebar: React.FC<AISidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onUpdateConversation,
  onDeleteConversation,
  isOpen,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filtered = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pinned = filtered.filter((c) => c.is_pinned);
  const unpinned = filtered.filter((c) => !c.is_pinned);

  const startEditing = (c: AIConversationItem) => {
    setEditingId(c._id);
    setEditTitle(c.title);
  };

  const saveEditing = (id: string) => {
    if (editTitle.trim()) {
      onUpdateConversation(id, { title: editTitle.trim() });
    }
    setEditingId(null);
  };

  return (
    <aside
      className={cn(
        "w-72 bg-card border-r border-border flex flex-col h-full shrink-0 transition-all duration-200",
        !isOpen && "hidden md:flex md:w-16"
      )}
    >
      {/* Sidebar Header */}
      <div className="p-3 border-b border-border space-y-2">
        <button
          onClick={onNewConversation}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground rounded-2xl font-semibold text-xs shadow-md transition"
        >
          <Plus size={16} />
          {isOpen && <span>New Chat</span>}
        </button>

        {isOpen && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search chats…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-muted/50 border border-border rounded-xl text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>
        )}
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3 scrollbar-thin">
        {isOpen ? (
          <>
            {pinned.length > 0 && (
              <div className="space-y-1">
                <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                  <Pin size={10} className="text-primary" /> Pinned
                </span>
                {pinned.map((c) => renderConversationItem(c))}
              </div>
            )}

            <div className="space-y-1">
              {pinned.length > 0 && (
                <span className="px-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mt-2">
                  Recent Chats
                </span>
              )}
              {unpinned.length === 0 && pinned.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  <Sparkles size={20} className="mx-auto mb-1 text-muted-foreground/60" />
                  No chat history yet
                </div>
              ) : (
                unpinned.map((c) => renderConversationItem(c))
              )}
            </div>
          </>
        ) : (
          <div className="space-y-2">
            {conversations.slice(0, 8).map((c) => (
              <button
                key={c._id}
                onClick={() => onSelectConversation(c._id)}
                title={c.title}
                className={cn(
                  "w-10 h-10 mx-auto rounded-xl flex items-center justify-center transition",
                  activeConversationId === c._id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <MessageSquare size={16} />
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );

  function renderConversationItem(c: AIConversationItem) {
    const isActive = activeConversationId === c._id;
    const isEditing = editingId === c._id;

    return (
      <div
        key={c._id}
        onClick={() => !isEditing && onSelectConversation(c._id)}
        className={cn(
          "group relative flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition",
          isActive
            ? "bg-primary/10 text-primary font-semibold border border-primary/20"
            : "text-foreground hover:bg-muted/70"
        )}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <MessageSquare size={14} className={isActive ? "text-primary shrink-0" : "text-muted-foreground shrink-0"} />
          {isEditing ? (
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && saveEditing(c._id)}
              className="w-full bg-background border border-primary/50 rounded px-1.5 py-0.5 text-xs text-foreground focus:outline-none"
              autoFocus
            />
          ) : (
            <span className="truncate">{c.title}</span>
          )}
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {isEditing ? (
            <>
              <button onClick={() => saveEditing(c._id)} className="p-1 text-success hover:bg-muted rounded">
                <Check size={12} />
              </button>
              <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:bg-muted rounded">
                <X size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateConversation(c._id, { is_pinned: !c.is_pinned });
                }}
                className={cn(
                  "p-1 rounded transition",
                  c.is_pinned ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Pin size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(c);
                }}
                className="p-1 text-muted-foreground hover:text-foreground rounded"
              >
                <Edit2 size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(c._id);
                }}
                className="p-1 text-muted-foreground hover:text-danger rounded"
              >
                <Trash2 size={12} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
};
