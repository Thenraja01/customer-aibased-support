import { Brain, Info, Sliders } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface RagSettingsPanelProps {
  form: any;
  updateField: (path: string, value: any) => void;
}

const RAG_FIELDS = [
  {
    key: "chunk_size",
    label: "Chunk Size",
    description: "Number of tokens per document chunk during ingestion.",
    min: 100,
    max: 4000,
    step: 50,
    default: 500,
    hint: "Recommended: 300–800 tokens. Larger chunks give broader context; smaller give finer precision.",
  },
  {
    key: "chunk_overlap",
    label: "Chunk Overlap",
    description: "Number of overlapping tokens between consecutive chunks.",
    min: 0,
    max: 500,
    step: 10,
    default: 100,
    hint: "Typically 10–20% of chunk size. Overlap preserves context at boundaries.",
  },
  {
    key: "top_k",
    label: "Top K Results",
    description: "Maximum number of document chunks retrieved per query.",
    min: 1,
    max: 50,
    step: 1,
    default: 5,
    hint: "Higher values improve recall but increase token usage and latency.",
  },
  {
    key: "min_score",
    label: "Minimum Similarity Score",
    description: "Minimum cosine similarity threshold for retrieved chunks.",
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.35,
    hint: "Range: 0.0–1.0. Higher values filter out less-relevant chunks.",
  },
  {
    key: "bfs_max_depth",
    label: "GraphRAG BFS Depth",
    description: "Maximum depth for breadth-first search in the knowledge graph.",
    min: 1,
    max: 6,
    step: 1,
    default: 2,
    hint: "Depth 2–3 is optimal. Higher values add coverage but increase latency.",
  },
] as const;

export default function RagSettingsPanel({ form, updateField }: RagSettingsPanelProps) {
  const rag = form.rag_config || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Brain size={18} className="text-primary" />
          RAG Configuration
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Fine-tune retrieval-augmented generation parameters that control how documents are chunked,
          indexed, and retrieved at query time.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-xs text-primary">
        <Info size={14} className="mt-0.5 shrink-0" />
        <span>
          Changes here affect <strong>all new document ingestion and queries</strong> for this
          organization. Previously indexed chunks are not re-chunked automatically — trigger a
          re-index in the Topic Management page after changing chunk settings.
        </span>
      </div>

      {/* Fields grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {RAG_FIELDS.map(({ key, label, description, min, max, step, default: def, hint }) => {
          const value = rag[key] !== undefined ? rag[key] : def;
          return (
            <div key={key} className="rounded-xl border dark:border-white/[0.06] p-4 space-y-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-primary" />
                  <Label className="text-sm font-semibold">{label}</Label>
                  <span className="ml-auto text-xs font-mono font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md">
                    {value}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{description}</p>
              </div>

              <div className="space-y-1">
                <input
                  type="range"
                  min={min}
                  max={max}
                  step={step}
                  value={value}
                  onChange={(e) => updateField(`rag_config.${key}`, Number(e.target.value))}
                  className="w-full accent-primary cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>{min}</span>
                  <span>{max}</span>
                </div>
              </div>

              <Input
                type="number"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => updateField(`rag_config.${key}`, Number(e.target.value))}
                className="text-xs font-mono"
              />

              <p className="text-[10px] text-muted-foreground italic">{hint}</p>
            </div>
          );
        })}
      </div>

      {/* Current config summary */}
      <div className="rounded-xl border dark:border-white/[0.06] bg-muted/30 dark:bg-white/[0.02] p-4">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Current Config Preview
        </h4>
        <pre className="text-[11px] font-mono text-muted-foreground overflow-x-auto">
          {JSON.stringify(
            {
              chunk_size: rag.chunk_size ?? 500,
              chunk_overlap: rag.chunk_overlap ?? 100,
              top_k: rag.top_k ?? 5,
              min_score: rag.min_score ?? 0.35,
              bfs_max_depth: rag.bfs_max_depth ?? 2,
            },
            null,
            2
          )}
        </pre>
      </div>
    </div>
  );
}
