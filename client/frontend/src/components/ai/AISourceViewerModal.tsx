import React from "react";
import { X, FileText, Sparkles, ShieldCheck, Tag } from "lucide-react";
import { AISourceItem } from "@/api/ai.api";

interface AISourceViewerModalProps {
  source: AISourceItem | null;
  onClose: () => void;
}

export const AISourceViewerModal: React.FC<AISourceViewerModalProps> = ({ source, onClose }) => {
  if (!source) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-100 truncate">{source.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  {source.relevance ? `${source.relevance}% Match` : "RAG Source"}
                </span>
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <ShieldCheck size={11} /> Tenant Verified
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Details */}
        <div className="space-y-4 text-xs text-slate-300">
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 space-y-2 leading-relaxed">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={12} className="text-indigo-400" /> Vector Chunk ID
            </span>
            <p className="font-mono text-[11px] text-indigo-300 truncate">
              {source.chunk_id || source.id}
            </p>
          </div>

          {source.entities && source.entities.length > 0 && (
            <div className="bg-slate-950/50 border border-slate-800/60 rounded-xl p-3 space-y-1.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block flex items-center gap-1">
                <Sparkles size={11} className="text-amber-400" /> GraphRAG Extracted Entities
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {source.entities.map((e, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-lg text-[10px] bg-slate-800 text-slate-200 border border-slate-700"
                  >
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="text-[11px] text-slate-500">Source verified by RAG engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
