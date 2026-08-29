import React, { useState, useRef, useEffect, useCallback, memo } from "react";
import {
  Send,
  Paperclip,
  X,
  Sparkles,
  Zap,
  FileText,
  ShieldCheck,
  RefreshCw,
  Clock,
  CreditCard,
  HelpCircle,
  Truck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useSocket } from "@/context/SocketContext";
import { useAuthContext } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useQuery } from "@tanstack/react-query";
import AxiosInstance from "@/api/axiosInstance";

interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  disabled?: boolean;
  initialValue?: string;
  chatId?: string;
}

const PILL_ICON_MAP: Record<string, any> = {
  refund: RefreshCw,
  return: RefreshCw,
  billing: CreditCard,
  payment: CreditCard,
  pricing: CreditCard,
  security: ShieldCheck,
  auth: ShieldCheck,
  shipping: Truck,
  delivery: Truck,
  track: Clock,
  diagnostic: Zap,
};

const ChatInput = memo(function ChatInput({
  onSend,
  disabled = false,
  initialValue,
  chatId,
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { orgSettings } = useAuthContext();
  const botName = orgSettings?.chatbot_name || "Support Assistant";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { socket } = useSocket();

  // Purely dynamic backend knowledge query: topics, document summaries, graph entities
  const { data: displayPills = [] } = useQuery({
    queryKey: ["chat-input-quick-actions"],
    queryFn: async () => {
      try {
        // 1. Unified Intelligence Quick Actions
        const res = await AxiosInstance.get("/chats/quick-actions");
        const actions = res.data?.quickActions || res.data?.data || [];
        if (Array.isArray(actions) && actions.length > 0) {
          return actions.slice(0, 4).map((a: any) => {
            const name = a.label || a.title || "Knowledge";
            const lower = name.toLowerCase();
            let matchedIcon = Zap;
            for (const [k, ic] of Object.entries(PILL_ICON_MAP)) {
              if (lower.includes(k) || (a.icon && a.icon.toLowerCase().includes(k))) {
                matchedIcon = ic;
                break;
              }
            }
            return {
              label: name,
              query: a.query || `Tell me about ${name} from our documentation`,
              icon: matchedIcon,
            };
          });
        }

        // 2. Published Document Summaries
        const docRes = await AxiosInstance.get("/documents", { params: { status: "published", limit: 4 } });
        const docs = docRes.data?.data?.documents || docRes.data?.documents || docRes.data?.data || [];
        if (Array.isArray(docs) && docs.length > 0) {
          return docs.slice(0, 4).map((d: any) => {
            const name = (d.title || "Document").replace(/\.[a-zA-Z0-9]+$/, "").trim();
            return {
              label: name,
              query: `Summarize "${name}" policies from the knowledge base.`,
              icon: Zap,
            };
          });
        }

        return [];
      } catch {
        return [];
      }
    },
    staleTime: 60000,
  });

  const typingValue = useDebounce(message, 300);
  const typingEmittedRef = useRef(false);

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      if (!socket || !chatId) return;
      socket.emit(isTyping ? "typing:start" : "typing:stop", { chatId });
    },
    [socket, chatId]
  );

  useEffect(() => {
    if (initialValue !== undefined) {
      setMessage(initialValue);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 180) + "px";
      }
    }
  }, [initialValue]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const val = e.target.value;
      setMessage(val);
      if (chatId && socket && val.trim()) {
        if (!typingEmittedRef.current) {
          emitTyping(true);
          typingEmittedRef.current = true;
        }
      }
    },
    [chatId, socket, emitTyping]
  );

  useEffect(() => {
    if (typingValue === message && message.trim() && typingEmittedRef.current) {
      return;
    }
    if (!message.trim() && typingEmittedRef.current) {
      emitTyping(false);
      typingEmittedRef.current = false;
    }
  }, [typingValue, message, emitTyping]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = message.trim();
      if (!trimmed && !selectedFile) return;
      if (disabled) return;
      emitTyping(false);
      typingEmittedRef.current = false;
      onSend(trimmed, selectedFile || undefined);
      setMessage("");
      setSelectedFile(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [message, selectedFile, disabled, onSend, emitTyping]
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleInput = useCallback(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 180) + "px";
    }
  }, []);

  const hasContent = message.trim().length > 0 || selectedFile !== null;

  return (
    <div className="w-full px-2 sm:px-4 pb-4 pt-1 bg-transparent select-none">
      {/* 1. Interactive Floating Quick Suggestion Chips */}
      {!chatId && displayPills.length > 0 && (
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 shrink-0 text-[11px] font-bold text-primary px-1">
            <Sparkles size={13} className="text-primary animate-pulse" />
            <span>Suggested:</span>
          </div>
          {displayPills.map((pill, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSend(pill.query)}
              className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-card/80 border border-border/80 hover:border-primary/50 hover:bg-primary/10 text-muted-foreground hover:text-foreground transition-all duration-200 shadow-sm active:scale-95"
            >
              <pill.icon size={12} className="text-primary" />
              <span>{pill.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* 2. Main 3D Floating Input Capsule */}
      <form
        onSubmit={handleSubmit}
        className={cn(
          "relative rounded-2xl border transition-all duration-300 backdrop-blur-2xl bg-card/90",
          "border-border/70 hover:border-primary/40",
          "focus-within:border-primary/60 focus-within:ring-4 focus-within:ring-primary/10",
          "shadow-[0_10px_35px_-5px_rgba(0,0,0,0.15),0_0_20px_rgba(16,185,129,0.05)]",
          "focus-within:shadow-[0_15px_40px_-5px_rgba(0,0,0,0.25),0_0_30px_rgba(16,185,129,0.18)]"
        )}
      >
        {/* Selected File Chip */}
        <AnimatePresence>
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="pt-2 px-3 flex items-center gap-2"
            >
              <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/25 rounded-xl px-3 py-1.5 text-xs text-primary shadow-sm">
                <FileText size={13} className="text-primary" />
                <span className="truncate max-w-[240px] font-medium">{selectedFile.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  ({(selectedFile.size / 1024).toFixed(0)} KB)
                </span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="hover:text-destructive transition-colors p-0.5 rounded-full hover:bg-black/20"
                >
                  <X size={13} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input Text Area */}
        <div className="flex items-end px-3 py-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
            title="Attach document or screenshot"
          >
            <Paperclip size={18} />
          </button>

          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={`Ask ${botName} anything or type your request...`}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent px-2.5 py-1.5 text-sm",
              "placeholder:text-muted-foreground/60 text-foreground font-sans",
              "focus:outline-none leading-relaxed",
              "min-h-[40px] max-h-[180px]",
              "disabled:cursor-not-allowed disabled:opacity-50 scrollbar-thin"
            )}
          />

          {/* 3D Action Send Button */}
          <div className="flex items-center gap-1.5 shrink-0 pl-2">
            <motion.button
              type="submit"
              disabled={!hasContent || disabled}
              whileHover={hasContent ? { scale: 1.06, y: -1 } : {}}
              whileTap={hasContent ? { scale: 0.94, y: 1 } : {}}
              className={cn(
                "h-9 w-9 rounded-xl flex items-center justify-center transition-all duration-200 shadow-md",
                hasContent
                  ? "bg-gradient-to-r from-primary via-emerald-400 to-teal-400 text-black font-bold shadow-[0_4px_16px_rgba(16,185,129,0.4)]"
                  : "bg-muted/80 text-muted-foreground/40 cursor-not-allowed shadow-none"
              )}
            >
              <Send size={15} className={hasContent ? "translate-x-[1px]" : ""} />
            </motion.button>
          </div>
        </div>

        {/* Input Bar Bottom Info Strip */}
        <div className="flex items-center justify-between px-3.5 pb-2 text-[10px] text-muted-foreground border-t border-border/40 pt-1.5">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 text-primary font-semibold">
              <Zap size={11} /> AI Neural RAG Engine
            </span>
            <span className="hidden sm:inline opacity-40">·</span>
            <span className="hidden sm:inline text-muted-foreground/70">
              End-to-End Enterprise Encrypted
            </span>
          </div>

          <div className="flex items-center gap-1 text-muted-foreground/70 font-mono text-[10px]">
            <span>Press</span>
            <kbd className="px-1.5 py-0.5 rounded bg-muted text-foreground border border-border text-[9px] font-bold">
              Enter ↵
            </kbd>
            <span className="hidden sm:inline">to send</span>
          </div>
        </div>
      </form>
    </div>
  );
});

export default ChatInput;
