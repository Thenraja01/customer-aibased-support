import React from "react";
import { X, ExternalLink, FileText } from "lucide-react";
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
  if (!isOpen) return null;

  const fullUrl = fileUrl
    ? fileUrl.startsWith("http")
      ? fileUrl
      : `${import.meta.env.VITE_BACKEND_URL || "http://localhost:5000"}${fileUrl.startsWith("/") ? "" : "/"}${fileUrl}`
    : null;

  const isPdf = fullUrl?.toLowerCase().includes(".pdf");
  const isImage = fullUrl?.match(/\.(jpeg|jpg|gif|png|webp|svg)/i);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/50">
          <div className="flex items-center gap-3 min-w-0 pr-4">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center shrink-0">
              <FileText size={18} />
            </div>
            <h3 className="font-semibold text-sm text-slate-100 truncate">{title}</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {fullUrl && (
              <a
                href={fullUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
                title="Open in new tab"
              >
                <ExternalLink size={16} />
              </a>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800"
              onClick={onClose}
            >
              <X size={18} />
            </Button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {citation && (
            <div className="p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-200 text-xs leading-relaxed font-mono">
              <span className="font-bold text-indigo-400 block mb-1">Citation Excerpt:</span>
              {typeof citation === "string" ? (
                citation
              ) : typeof citation === "object" ? (
                <div className="space-y-1.5 font-sans">
                  {citation.excerpt && (
                    <p className="font-mono text-xs text-indigo-200">{citation.excerpt}</p>
                  )}
                  {citation.text && !citation.excerpt && (
                    <p className="font-mono text-xs text-indigo-200">{citation.text}</p>
                  )}
                  {citation.content && !citation.excerpt && !citation.text && (
                    <p className="font-mono text-xs text-indigo-200">{citation.content}</p>
                  )}
                  <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-indigo-300/80">
                    {citation.documentName && <span>📄 {citation.documentName}</span>}
                    {citation.chunkIndex !== undefined && <span>Chunk: {citation.chunkIndex}</span>}
                    {citation.pageNumber && <span>Page: {citation.pageNumber}</span>}
                    {(citation.relevanceScore || citation.score) && (
                      <span className="font-semibold text-emerald-400">
                        Score: {Math.round((citation.relevanceScore || citation.score) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                String(citation)
              )}
            </div>
          )}

          {fullUrl ? (
            <div className="w-full h-[60vh] rounded-xl bg-slate-950 border border-slate-800/80 overflow-hidden flex items-center justify-center">
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
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <iframe
                  src={fullUrl}
                  title={title}
                  className="w-full h-full border-0"
                />
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-2">
              <FileText size={40} className="text-slate-600" />
              <p className="text-xs">No file preview available for this document.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
