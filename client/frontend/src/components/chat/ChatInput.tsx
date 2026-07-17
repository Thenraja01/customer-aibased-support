import { useState, useRef, useCallback, memo } from "react";
import { Send, Paperclip, X, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string, file?: File) => void;
  disabled: boolean;
}

function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

const ChatInput = memo(function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      const trimmed = message.trim();
      if (!trimmed && !selectedFile) return;
      if (disabled) return;
      onSend(trimmed, selectedFile || undefined);
      setMessage("");
      setSelectedFile(null);
      setImagePreview(null);
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
    [message, selectedFile, disabled, onSend]
  );

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
    }
  }, []);

  const handleRemoveFile = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
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
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Message Support Assistant..."
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
          <div className="mt-2 px-2">
            {imagePreview ? (
              <div className="relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 w-20 object-cover rounded-lg border dark:border-white/[0.06]"
                />
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:bg-destructive/80 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5 text-xs">
                <ImageIcon size={14} className="text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate max-w-[200px]">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="hover:text-destructive transition-colors shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            )}
          </div>
        )}
      </form>
      <p className="text-[10px] text-muted-foreground text-center mt-2">
        Support Assistant can make mistakes. Consider checking important information.
      </p>
    </div>
  );
});

export default ChatInput;