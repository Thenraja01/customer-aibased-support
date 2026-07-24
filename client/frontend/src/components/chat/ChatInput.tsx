import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSocket } from "@/context/SocketContext";
import { useAuthContext } from "@/context/AuthContext";

interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  disabled?: boolean;
  initialValue?: string;
  chatId?: string;
}

const ChatInput = memo(function ChatInput({ onSend, disabled = false, initialValue, chatId }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const { orgSettings } = useAuthContext();
  const botName = orgSettings?.chatbot_name || "Support Assistant";
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { socket } = useSocket();

  useEffect(() => {
    if (initialValue !== undefined) {
      setMessage(initialValue);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
    }
  }, [initialValue]);

  const emitTyping = useCallback((isTyping: boolean) => {
    if (!socket || !chatId) return;
    socket.emit(isTyping ? "typing:start" : "typing:stop", { chatId });
  }, [socket, chatId]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    if (chatId && socket) {
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      } else {
        emitTyping(true);
      }
      typingTimerRef.current = setTimeout(() => {
        emitTyping(false);
        typingTimerRef.current = null;
      }, 2000);
    }
  }, [chatId, socket, emitTyping]);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = message.trim();
      if (!trimmed && !selectedFile) return;
      if (disabled) return;
      emitTyping(false);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
        typingTimerRef.current = null;
      }
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
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, []);

  return (
    <div className="px-4 pb-4 pt-2">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={cn(
            "flex items-end rounded-2xl border dark:border-white/[0.06] bg-background dark:bg-muted/30 shadow-sm",
            "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 dark:focus-within:border-primary/30 transition-all"
          )}
        >
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
            className="flex-shrink-0 p-3 hover:bg-muted/50 rounded-l-2xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Paperclip size={18} className="text-muted-foreground" />
          </button>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={`Message ${botName}...`}
            disabled={disabled}
            rows={1}
            className={cn(
              "flex-1 resize-none bg-transparent px-2 py-3 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none",
              "min-h-[44px] max-h-[200px]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <Button
            type="submit"
            size="icon-sm"
            disabled={(!message.trim() && !selectedFile) || disabled}
            className={cn(
              "flex-shrink-0 m-1.5 rounded-xl transition-all duration-200",
              (message.trim() || selectedFile)
                ? "bg-gradient-to-br from-primary to-secondary text-primary-foreground hover:opacity-90 shadow-sm shadow-primary/20"
                : "bg-muted dark:bg-white/[0.06] text-muted-foreground"
            )}
          >
            <Send size={14} />
          </Button>
        </div>
        {selectedFile && (
          <div className="mt-2 flex items-center gap-2 px-2">
            <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-muted-foreground truncate max-w-[200px]">{selectedFile.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="hover:text-destructive transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        )}
      </form>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        {botName} can make mistakes. Consider checking important information.
      </p>
    </div>
  );
});

export default ChatInput;
