import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Database, Share2, FileText, HeartPulse, Activity, CheckCircle2, AlertTriangle } from "lucide-react";
import { KnowledgeGraphAPI } from "@/api";
import { useToast } from "@/components/ui/toast";

interface IndexStatus {
  documents?: { total: number; uploaded: number; processing: number; failed: number; indexed: number };
  graph?: { nodes: number; relationships: number; lastUpdated: string | null };
  vectorIndex?: { chunks: number; indexed: number };
}

interface GraphStats {
  entityCount?: number;
  relationshipCount?: number;
  totalDocs?: number;
  indexedDocs?: number;
  totalTopics?: number;
  activeTopics?: number;
  lastIndexed?: string | null;
  status?: string;
}

function ProgressBar({ value, max, tone }: { value: number; max: number; tone: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
      <div className={`h-full rounded-full ${tone} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function HealthMonitorTab() {
  const toast = useToast();
  const [status, setStatus] = useState<IndexStatus | null>(null);
  const [stats, setStats] = useState<GraphStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reindexing, setReindexing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statusRes, statsRes] = await Promise.allSettled([
        KnowledgeGraphAPI.getIndexStatus(),
        KnowledgeGraphAPI.getGraphStats(),
      ]);
      if (statusRes.status === "fulfilled" && statusRes.value?.data?.success) {
        setStatus(statusRes.value.data.data);
      }
      if (statsRes.status === "fulfilled" && statsRes.value?.data?.success) {
        setStats(statsRes.value.data.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleReindex = async () => {
    if (!confirm("Reindex the entire knowledge base? This re-processes every document in the background.")) return;
    setReindexing(true);
    try {
      const res = await KnowledgeGraphAPI.reindexKnowledge();
      toast.success("Reindexing started", res.data?.message || "Knowledge base reindexing started in the background.");
      setTimeout(fetchData, 3000);
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || "Failed to start reindexing");
    } finally {
      setReindexing(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 size={28} className="animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading health metrics...</p>
      </div>
    );
  }

  const docs = status?.documents || { total: 0, uploaded: 0, processing: 0, failed: 0, indexed: 0 };
  const vector = status?.vectorIndex || { chunks: 0, indexed: 0 };
  const graph = status?.graph || { nodes: 0, relationships: 0, lastUpdated: null };
  const healthy = (stats?.status || "").toLowerCase().includes("healthy") || !stats?.status;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <HeartPulse size={18} className="text-primary" /> Knowledge Health &amp; Monitoring
          </h2>
          <p className="text-sm text-muted-foreground">Track indexing status, retrieval readiness, and vector index health.</p>
        </div>
        <Button variant="outline" onClick={handleReindex} disabled={reindexing}>
          {reindexing ? <Loader2 size={14} className="animate-spin mr-1" /> : <RefreshCw size={14} className="mr-1" />}
          {reindexing ? "Reindexing..." : "Reindex Knowledge Base"}
        </Button>
      </div>

      {/* Health status banner */}
      <div className={`rounded-xl border px-5 py-4 flex items-center gap-3 ${
        healthy
          ? "border-green-500/30 bg-green-500/5"
          : "border-amber-500/30 bg-amber-500/5"
      }`}>
        {healthy ? (
          <CheckCircle2 size={20} className="text-green-500 shrink-0" />
        ) : (
          <AlertTriangle size={20} className="text-amber-500 shrink-0" />
        )}
        <div>
          <p className="text-sm font-semibold">{stats?.status || "Knowledge Base Status"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {stats?.lastIndexed
              ? `Last indexed ${new Date(stats.lastIndexed).toLocaleString()}`
              : "No indexing activity recorded yet."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Documents */}
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <FileText size={16} className="text-blue-500" />
            <h3 className="text-sm font-semibold">Document Index</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total documents</span>
              <span className="text-lg font-bold">{docs.total}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Indexed</span>
                <span className="text-xs font-medium">{docs.indexed}/{docs.total}</span>
              </div>
              <ProgressBar value={docs.indexed} max={docs.total} tone="bg-green-500" />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 px-2 py-2">
                <p className="text-sm font-bold">{docs.uploaded}</p>
                <p className="text-[10px] text-muted-foreground">Uploaded</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-2 py-2">
                <p className="text-sm font-bold text-indigo-500">{docs.processing}</p>
                <p className="text-[10px] text-muted-foreground">Processing</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-2 py-2">
                <p className="text-sm font-bold text-red-500">{docs.failed}</p>
                <p className="text-[10px] text-muted-foreground">Failed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Vector Index */}
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Database size={16} className="text-indigo-500" />
            <h3 className="text-sm font-semibold">Vector Index</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total chunks</span>
              <span className="text-lg font-bold">{vector.chunks}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground">Embedded</span>
                <span className="text-xs font-medium">{vector.indexed}/{vector.chunks}</span>
              </div>
              <ProgressBar value={vector.indexed} max={vector.chunks} tone="bg-indigo-500" />
            </div>
            <div className="rounded-lg bg-muted/50 px-3 py-2 flex items-center gap-2">
              <Activity size={14} className="text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                {vector.indexed >= vector.chunks && vector.chunks > 0
                  ? "All chunks embedded and ready for semantic retrieval."
                  : "Chunks pending embedding will not appear in semantic search results."}
              </p>
            </div>
          </div>
        </div>

        {/* Knowledge Graph */}
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-4 border-b border-border flex items-center gap-2">
            <Share2 size={16} className="text-purple-500" />
            <h3 className="text-sm font-semibold">Knowledge Graph</h3>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-lg font-bold">{stats?.entityCount ?? graph.nodes}</p>
                <p className="text-[10px] text-muted-foreground">Entities</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-lg font-bold">{stats?.relationshipCount ?? graph.relationships}</p>
                <p className="text-[10px] text-muted-foreground">Relationships</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-lg font-bold">{stats?.totalTopics ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Topics</p>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <p className="text-lg font-bold">{stats?.activeTopics ?? 0}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>
            </div>
            {graph.lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last graph update: {new Date(graph.lastUpdated).toLocaleString()}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="rounded-xl border border-dashed border-border px-5 py-4">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Note:</strong> Per-document indexing details and a live queue of
          background jobs are tracked on the server. Reindexing re-processes all documents in the background and may
          take several minutes depending on the size of your knowledge base.
        </p>
      </div>
    </div>
  );
}
