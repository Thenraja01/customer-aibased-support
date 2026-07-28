import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "default";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open, onCancel]);

  if (!open) return null;

  const confirmStyles = {
    danger: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    default: "bg-primary text-primary-foreground hover:bg-primary/90",
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel} />
      <div
        ref={dialogRef}
        className="relative z-10 w-full max-w-md mx-4 rounded-2xl border bg-card p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-muted transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-3 mb-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
            variant === "danger" ? "bg-destructive/10" : variant === "warning" ? "bg-amber-500/10" : "bg-primary/10"
          }`}>
            <AlertTriangle size={20} className={
              variant === "danger" ? "text-destructive" : variant === "warning" ? "text-amber-500" : "text-primary"
            } />
          </div>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>

        <p className="text-sm text-muted-foreground mb-5 pl-[52px]">{message}</p>

        <div className="flex justify-end gap-2 pl-[52px]">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button size="sm" className={confirmStyles[variant]} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
