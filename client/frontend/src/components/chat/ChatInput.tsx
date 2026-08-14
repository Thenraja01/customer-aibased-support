import { useState, useRef, useEffect, useCallback, memo } from "react";
import { Send, Paperclip, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSocket } from "@/context/SocketContext";
import { useAuthContext } from "@/context/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";

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
  const { socket } = useSocket();

  const typingValue = useDebounce(message, 300);
  const typingEmittedRef = useRef(false);

  const emitTyping = useCallback((isTyping: boolean) => {
    if (!socket || !chatId) return;
    socket.emit(isTyping ? "typing:start" : "typing:stop", { chatId });
  }, [socket, chatId]);

  useEffect(() => {
    if (initialValue !== undefined) {
      setMessage(initialValue);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + "px";
      }
    }
  }, [initialValue]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);
    if (chatId && socket && val.trim()) {
      if (!typingEmittedRef.current) {
        emitTyping(true);
        typingEmittedRef.current = true;
      }
    }
  }, [chatId, socket, emitTyping]);

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
      el.style.height = Math.min(el.scrollHeight, 200) + "px";
    }
  }, []);

  return (
    <div className="px-4 pb-4 pt-2 bg-transparent md:px-6">
      <form onSubmit={handleSubmit} className="relative">
        {/* File preview */}
        {selectedFile && (
          <div className="mb-2 flex items-center gap-2 px-1">
            <div className="flex items-center gap-2 bg-muted rounded-lg px-3 py-1.5 text-xs border border-border">
              <Paperclip size={12} className="text-muted-foreground" />
              <span className="text-muted-foreground truncate max-w-[200px]">{selectedFile.name}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="hover:text-destructive transition-colors p-0.5"
                aria-label="Remove file"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        <div
          className={cn(
            "flex items-end rounded-xl border border-border bg-card",
            "focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all"
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
            className="flex-shrink-0 p-3 hover:bg-muted/50 rounded-l-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Attach file"
          >
            <Paperclip size={16} className="text-muted-foreground" />
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
              "flex-1 resize-none bg-transparent px-1 py-3 text-sm",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none",
              "min-h-[44px] max-h-[200px]",
              "disabled:cursor-not-allowed disabled:opacity-50"
            )}
          />
          <button
            type="submit"
            disabled={(!message.trim() && !selectedFile) || disabled}
            className={cn(
              "flex-shrink-0 m-1.5 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
              (message.trim() || selectedFile)
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                : "bg-muted text-muted-foreground/40"
            )}
            aria-label="Send message"
          >
            <Send size={14} />
          </button>
        </div>
      </form>
      <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
        {botName} can make mistakes. Consider checking important information.
      </p>
    </div>
  );
});

export default ChatInput;
