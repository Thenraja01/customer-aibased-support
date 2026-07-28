import { useState, useEffect, useCallback } from "react";
import {
  AlertTriangle, Search, CheckCircle, XCircle, Trash2,
  Eye, ChevronLeft, ChevronRight,
  RefreshCw, Tag, Clock, BookOpen, TrendingUp
} from "lucide-react";
import { KnowledgeGapAPI } from "@/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StatsCard from "@/components/admin/StatsCard";
import { useToast } from "@/components/ui/toast";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface KnowledgeGap {
  _id: string;
  organization_id: string;
  user_id?: { _id: string; name: string; email: string } | null;
  chat_id?: string;
  query: string;
  best_score: number;
  avg_score: number;
  matched_chunks: number;
  keywords: string[];
  topic: string;
  status: "unresolved" | "reviewed" | "resolved" | "dismissed";
  resolution_note: string;
  resolved_by?: { _id: string; name: string; email: string } | null;
  resolved_at?: string | null;
  frequency: number;
  last_seen_at: string;
  created_at: string;
}

interface GapStats {
  summary: {
    totalGaps: number;
    unresolvedGaps: number;
    resolvedGaps: number;
    dismissedGaps: number;
    resolutionRate: number;
    totalDocuments: number;
    totalChunks: number;
  };
  topicDistribution: { topic: string; count: number; avgScore: number }[];
  severityDistribution: { severity: string; count: number }[];
  recentTrend: { date: string; count: number; avgScore: number }[];
  topFrequentGaps: KnowledgeGap[];
}

const STATUS_TABS = ["", "unresolved", "reviewed", "resolved", "dismissed"] as const;

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  unresolved: { label: "Unresolved", color: "bg-red-500/10 text-red-600", icon: <AlertTriangle size={12} /> },
  reviewed: { label: "Reviewed", color: "bg-amber-500/10 text-amber-600", icon: <Eye size={12} /> },
  resolved: { label: "Resolved", color: "bg-green-500/10 text-green-600", icon: <CheckCircle size={12} /> },
  dismissed: { label: "Dismissed", color: "bg-muted text-muted-foreground", icon: <XCircle size={12} /> },
};

const severityColor = (score: number) => {
  if (score < 0.2) return "text-red-600 bg-red-500/10";
  if (score < 0.35) return "text-orange-600 bg-orange-500/10";
  if (score < 0.5) return "text-amber-600 bg-amber-500/10";
  return "text-green-600 bg-green-500/10";
};

const topicColor = (topic: string) => {
  const map: Record<string, string> = {
    billing: "bg-blue-500/10 text-blue-600",
    account: "bg-purple-500/10 text-purple-600",
    technical: "bg-red-500/10 text-red-600",
    shipping: "bg-cyan-500/10 text-cyan-600",
    product: "bg-emerald-500/10 text-emerald-600",
    security: "bg-rose-500/10 text-rose-600",
    onboarding: "bg-indigo-500/10 text-indigo-600",
    general: "bg-muted text-muted-foreground",
  };
  return map[topic] || map.general;
};

export default function KnowledgeGapPage() {
  const toast = useToast();
  const [gaps, setGaps] = useState<KnowledgeGap[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GapStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  const [statusFilter, setStatusFilter] = useState("");
  const [topicFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedGap, setSelectedGap] = useState<KnowledgeGap | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);

  const fetchGaps = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 15,
        sortBy,
        sortOrder,
      };
      if (statusFilter) params.status = statusFilter;
      if (topicFilter) params.topic = topicFilter;
      if (search) params.search = search;

      const res = await KnowledgeGapAPI.getAll(params);
      if (res.data.success) {
        setGaps(res.data.data);
        setTotalPages(res.data.pagination.totalPages);
        setTotal(res.data.pagination.total);
      }
    } catch {
      toast.error("Error", "Failed to load knowledge gaps");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, topicFilter, search, sortBy, sortOrder]);

  const fetchStats = useCallback(async () => {
    setLoadingStats(true);
    try {
      const res = await KnowledgeGapAPI.getStats();
      if (res.data.success) setStats(res.data.data);
    } catch {
      console.error("Failed to load stats");
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => { fetchGaps(); }, [fetchGaps]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  const handleResolve = async () => {
    if (!selectedGap) return;
    setActionLoading(true);
    try {
      await KnowledgeGapAPI.resolve(selectedGap._id, { note: resolveNote });
      setShowResolveModal(false);
      setSelectedGap(null);
      setResolveNote("");
      fetchGaps();
      fetchStats();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to resolve gap");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDismiss = async (gap: KnowledgeGap) => {
    setConfirmAction(() => async () => {
      setActionLoading(true);
      try {
        await KnowledgeGapAPI.dismiss(gap._id);
        fetchGaps();
        fetchStats();
      } catch (err: any) {
        toast.error("Error", err.response?.data?.message || "Failed to dismiss gap");
      } finally {
        setActionLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  const handleDelete = async (gap: KnowledgeGap) => {
    setConfirmAction(() => async () => {
      setActionLoading(true);
      try {
        await KnowledgeGapAPI.delete(gap._id);
        fetchGaps();
        fetchStats();
      } catch (err: any) {
        toast.error("Error", err.response?.data?.message || "Failed to delete gap");
      } finally {
        setActionLoading(false);
      }
    });
    setConfirmOpen(true);
  };

  const handleReview = async (gap: KnowledgeGap) => {
    setActionLoading(true);
    try {
      await KnowledgeGapAPI.updateStatus(gap._id, { status: "reviewed" });
      fetchGaps();
      fetchStats();
    } catch (err: any) {
      toast.error("Error", err.response?.data?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4 dark:border-white/[0.06]">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <AlertTriangle className="text-primary" size={28} />
            Knowledge Gaps
          </h1>
          <p className="text-muted-foreground text-sm">
            Identify unresolved queries and content gaps across your knowledge base.
          </p>
        </div>
        <Button onClick={() => { fetchGaps(); fetchStats(); }} variant="outline" className="gap-2 text-xs">
          <RefreshCw size={16} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Gaps"
          value={loadingStats ? "..." : stats?.summary.totalGaps ?? 0}
          icon={<AlertTriangle size={20} />}
          description="Detected knowledge gaps"
          className="border-primary/20 bg-primary/5"
        />
        <StatsCard
          title="Unresolved"
          value={loadingStats ? "..." : stats?.summary.unresolvedGaps ?? 0}
          icon={<Clock size={20} />}
          description="Awaiting resolution"
          className="border-red-500/20 bg-red-500/5"
        />
        <StatsCard
          title="Resolution Rate"
          value={loadingStats ? "..." : `${stats?.summary.resolutionRate ?? 0}%`}
          icon={<CheckCircle size={20} />}
          description="Gaps addressed"
          className="border-green-500/20 bg-green-500/5"
        />
        <StatsCard
          title="KB Coverage"
          value={loadingStats ? "..." : stats?.summary.totalDocuments ?? 0}
          icon={<BookOpen size={20} />}
          description={`${stats?.summary.totalChunks ?? 0} chunks indexed`}
          className="border-secondary/20 bg-secondary/5"
        />
      </div>

      {/* Topic Distribution */}
      {stats && stats.topicDistribution.length > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="bg-muted/30 border-b dark:border-white/[0.06]">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Tag size={18} className="text-primary" />
              Topic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-3">
              {stats.topicDistribution.map((t) => (
                <div key={t.topic} className="flex items-center gap-2 rounded-lg border px-3 py-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${topicColor(t.topic)}`}>
                    {t.topic}
                  </span>
                  <span className="text-sm font-semibold">{t.count}</span>
                  <span className="text-xs text-muted-foreground">
                    avg {Math.round(t.avgScore * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <Input
            placeholder="Search queries..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="created_at">Date Created</option>
          <option value="frequency">Frequency</option>
          <option value="best_score">Best Score</option>
          <option value="last_seen_at">Last Seen</option>
        </select>
        <Button
          variant="outline"
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="gap-1"
        >
          {sortOrder === "desc" ? "↓" : "↑"} {sortOrder === "desc" ? "Desc" : "Asc"}
        </Button>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {STATUS_TABS.map((s) => (
          <button
            key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              statusFilter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {/* Gap List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading knowledge gaps...</div>
      ) : gaps.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle size={40} className="mx-auto text-muted-foreground/40 mb-3" />
          <p className="text-muted-foreground">No knowledge gaps found.</p>
          <p className="text-xs text-muted-foreground mt-1">Gaps are auto-detected when users ask questions the KB can't answer well.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {gaps.map((gap) => (
            <div key={gap._id} className="rounded-xl border bg-card p-4 sm:p-5 space-y-3 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  {/* Status + Topic + Score */}
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 ${statusConfig[gap.status]?.color}`}>
                      {statusConfig[gap.status]?.icon}
                      {statusConfig[gap.status]?.label || gap.status}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${topicColor(gap.topic)}`}>
                      {gap.topic}
                    </span>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${severityColor(gap.best_score)}`}>
                      {Math.round(gap.best_score * 100)}% match
                    </span>
                    {gap.frequency > 1 && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-600 flex items-center gap-1">
                        <TrendingUp size={10} />
                        ×{gap.frequency}
                      </span>
                    )}
                  </div>

                  {/* Query */}
                  <h3 className="font-semibold text-sm">{gap.query}</h3>

                  {/* Meta */}
                  <div className="flex items-center gap-4 mt-1.5 text-xs text-muted-foreground flex-wrap">
                    <span>Chunks matched: {gap.matched_chunks}</span>
                    <span>Avg score: {Math.round(gap.avg_score * 100)}%</span>
                    <span>Keywords: {gap.keywords.slice(0, 5).join(", ")}</span>
                  </div>

                  {/* User + Timestamps */}
                  <div className="flex items-center gap-4 mt-2 text-[11px] text-muted-foreground/70 flex-wrap">
                    {gap.user_id?.name && <span>by {gap.user_id.name}</span>}
                    <span>Created {new Date(gap.created_at).toLocaleDateString()}</span>
                    <span>Last seen {new Date(gap.last_seen_at).toLocaleDateString()}</span>
                    {gap.resolved_by?.name && <span>Resolved by {gap.resolved_by.name}</span>}
                  </div>

                  {/* Resolution note */}
                  {gap.resolution_note && (
                    <div className="mt-2 rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      <strong>Note:</strong> {gap.resolution_note}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {gap.status === "unresolved" && (
                    <button
                      onClick={() => handleReview(gap)}
                      className="p-1.5 rounded-lg hover:bg-amber-500/10 text-amber-600"
                      title="Mark as reviewed"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                  {(gap.status === "unresolved" || gap.status === "reviewed") && (
                    <>
                      <button
                        onClick={() => { setSelectedGap(gap); setShowResolveModal(true); }}
                        className="p-1.5 rounded-lg hover:bg-green-500/10 text-green-600"
                        title="Resolve"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => handleDismiss(gap)}
                        className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"
                        title="Dismiss"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => handleDelete(gap)}
                    className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-muted-foreground">
            Showing {(page - 1) * 15 + 1}–{Math.min(page * 15, total)} of {total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage((p) => p - 1)}
            >
              <ChevronLeft size={14} />
            </Button>
            <span className="text-sm font-medium">{page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              <ChevronRight size={14} />
            </Button>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && selectedGap && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setShowResolveModal(false); setSelectedGap(null); setResolveNote(""); }}>
          <div className="bg-card rounded-xl shadow-2xl border max-w-lg w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Resolve Knowledge Gap</h2>
              <button onClick={() => { setShowResolveModal(false); setSelectedGap(null); setResolveNote(""); }} className="p-1 rounded hover:bg-muted"><XCircle size={18} /></button>
            </div>
            <div className="space-y-4">
              <div className="rounded-lg bg-muted/50 p-3">
                <p className="text-sm font-medium">{selectedGap.query}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Topic: {selectedGap.topic} · Frequency: {selectedGap.frequency}× · Best match: {Math.round(selectedGap.best_score * 100)}%
                </p>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Resolution Note (optional)</label>
                <textarea
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="What action was taken to resolve this gap?"
                  rows={3}
                  className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
                />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setShowResolveModal(false); setSelectedGap(null); setResolveNote(""); }} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleResolve} disabled={actionLoading} className="flex-1">
                  {actionLoading ? "Resolving..." : "Mark Resolved"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={confirmOpen}
        title="Confirm Action"
        message="Are you sure you want to perform this action? This cannot be undone."
        variant="danger"
        onConfirm={() => { confirmAction?.(); setConfirmOpen(false); }}
        onCancel={() => { setConfirmOpen(false); setConfirmAction(null); }}
      />
    </div>
  );
}
