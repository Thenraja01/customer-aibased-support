import { useEffect, useState } from "react";
import { RAGAPI, AISessionAPI } from "@/api";
import { Brain, Zap, Clock, MessageSquare, TrendingUp, BarChart3 } from "lucide-react";

export default function AIAnalyticsPage() {
  const [ragStats, setRagStats] = useState<any>(null);
  const [sessionStats, setSessionStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [ragRes, sessionRes] = await Promise.all([
        RAGAPI.getStats().catch(() => ({ data: { success: false, data: null } })),
        AISessionAPI.getStats().catch(() => ({ data: { success: false, data: null } })),
      ]);

      if (ragRes.data.success) setRagStats(ragRes.data.data);
      if (sessionRes.data.success) setSessionStats(sessionRes.data.data);
    } catch (error) {
      console.error("Failed to load AI analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading AI analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">AI Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Monitor AI performance, token usage, and session metrics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
              <p className="text-2xl font-bold mt-2">{sessionStats?.totalSessions || ragStats?.totalQueries || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <MessageSquare size={20} className="text-primary" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Tokens Used</p>
              <p className="text-2xl font-bold mt-2">{sessionStats?.totalTokens || ragStats?.totalTokens || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-secondary/10 dark:bg-secondary/15 flex items-center justify-center">
              <Zap size={20} className="text-secondary" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Avg Response Time</p>
              <p className="text-2xl font-bold mt-2">{ragStats?.avgResponseTime || sessionStats?.avgResponseTime || 0}ms</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center">
              <Clock size={20} className="text-accent-foreground" />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Documents Indexed</p>
              <p className="text-2xl font-bold mt-2">{ragStats?.documentsIndexed || 0}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center">
              <Brain size={20} className="text-primary" />
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" />
            RAG Performance
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Queries</span>
              <span className="text-sm font-medium">{ragStats?.totalQueries || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Successful Queries</span>
              <span className="text-sm font-medium">{ragStats?.successfulQueries || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Retrieval Score</span>
              <span className="text-sm font-medium">{ragStats?.avgScore || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Chunks Retrieved</span>
              <span className="text-sm font-medium">{ragStats?.chunksRetrieved || 0}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-secondary" />
            Session Metrics
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Sessions</span>
              <span className="text-sm font-medium">{sessionStats?.totalSessions || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Messages</span>
              <span className="text-sm font-medium">{sessionStats?.totalMessages || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Tokens per Session</span>
              <span className="text-sm font-medium">{sessionStats?.avgTokensPerSession || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Messages per Session</span>
              <span className="text-sm font-medium">{sessionStats?.avgMessagesPerSession || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Knowledge Graph Stats */}
      {ragStats?.graphStats && (
        <div className="rounded-xl border bg-card dark:bg-card/50 dark:border-white/[0.06] p-6 shadow-xs">
          <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
            <Brain size={18} className="text-primary" />
            Knowledge Graph Statistics
          </h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Nodes</span>
              <span className="text-sm font-medium">{ragStats.graphStats.totalNodes || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total Edges</span>
              <span className="text-sm font-medium">{ragStats.graphStats.totalEdges || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Documents Processed</span>
              <span className="text-sm font-medium">{ragStats.graphStats.documentsProcessed || 0}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
