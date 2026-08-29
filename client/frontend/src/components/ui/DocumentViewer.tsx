import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { X, ExternalLink, FileText, Sparkles, BookOpen, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DocumentViewerProps {
  title?: string;
  fileUrl?: string;
  isOpen: boolean;
  onClose: () => void;
  citation?: any;
}

export default function DocumentViewer({
  title = "Document Viewer",
  fileUrl,
  isOpen,
  onClose,
  citation,
}: DocumentViewerProps) {
  const [copied, setCopied] = React.useState(false);

  // Close on Escape key press and prevent background scroll
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === "undefined") return null;

  const fullUrl = fileUrl
    ? fileUrl.startsWith("http")
      ? fileUrl
      : `${import.meta.env.VITE_BACKEND_URL || "http://localhost:3030"}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`
    : null;

  const isPdf = fullUrl?.toLowerCase().includes(".pdf");
  const isImage = fullUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);

  const rawText =
    typeof citation === "string"
      ? citation
      : citation?.excerpt || citation?.text || citation?.content || "";

  const handleCopyExcerpt = () => {
    if (!rawText) return;
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render via createPortal directly into document.body to break out of all parent CSS transforms
  return createPortal(
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-6 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      <div
        className="relative w-full max-w-4xl max-h-[88vh] bg-card dark:bg-slate-950 border border-border/80 rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-border/60 bg-card/90 dark:bg-slate-900/90 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary border border-primary/25 flex items-center justify-center shrink-0 shadow-xs">
              <FileText size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-foreground truncate max-w-[280px] sm:max-w-md">
                {title}
              </h3>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                Knowledge Base Source Inspector
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {fullUrl && (
              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground bg-muted/60 hover:bg-muted border border-border transition shadow-2xs"
                title="Open original file in new tab"
              >
                <ExternalLink size={13} />
                <span className="hidden sm:inline">Open File</span>
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition"
              onClick={onClose}
              title="Close (Esc)"
            >
              <X size={19} />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 scrollbar-thin">
          {/* Citation Highlights Card */}
          {citation && (
            <div className="p-4 rounded-2xl bg-primary/5 dark:bg-primary/10 border border-primary/20 text-foreground space-y-2.5 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-primary flex items-center gap-1.5 text-xs uppercase tracking-wider">
                  <Sparkles size={13} className="text-primary" /> Verified Knowledge Citation
                </span>
                <div className="flex items-center gap-2">
                  {(citation.relevanceScore || citation.score) && (
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold">
                      Relevance: {Math.round((citation.relevanceScore || citation.score) * 100)}%
                    </span>
                  )}
                  {rawText && (
                    <button
                      type="button"
                      onClick={handleCopyExcerpt}
                      className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/10 transition"
                      title="Copy excerpt"
                    >
                      {copied ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
                    </button>
                  )}
                </div>
              </div>

              {rawText && (
                <div className="font-mono text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap bg-background/80 dark:bg-slate-900/80 p-3.5 rounded-xl border border-border/60 max-h-60 overflow-y-auto scrollbar-thin">
                  {rawText}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-muted-foreground font-medium">
                {citation.documentName && (
                  <span className="px-2 py-0.5 rounded-md bg-muted text-foreground border border-border/50">
                    📄 {citation.documentName}
                  </span>
                )}
                {citation.chunkIndex !== undefined && (
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                    Chunk #{citation.chunkIndex}
                  </span>
                )}
                {citation.pageNumber && (
                  <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                    Page {citation.pageNumber}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Document File / Text Preview */}
          {fullUrl ? (
            <div className="w-full h-[48vh] sm:h-[54vh] rounded-2xl bg-slate-950 border border-border/80 overflow-hidden flex items-center justify-center shadow-inner">
              {isPdf ? (
                <iframe
                  src={fullUrl}
                  title={title}
                  className="w-full h-full border-0"
                />
              ) : isImage ? (
                <img
                  src={fullUrl}
                  alt={title}
                  className="max-w-full max-h-full object-contain p-2"
                />
              ) : (
                <iframe
                  src={fullUrl}
                  title={title}
                  className="w-full h-full border-0 bg-slate-950"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-2 bg-muted/20 rounded-2xl border border-dashed border-border/60">
              <BookOpen size={36} className="text-muted-foreground/40" />
              <p className="text-xs">Original document is indexed into verified vector chunks above.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
