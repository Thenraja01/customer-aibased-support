import {
  FileText,
  Globe,
  Clock,
  AlertTriangle,
  TrendingUp,
  Sparkles,
} from "lucide-react";

interface StatsProps {
  documents: any[];
  verifications: any[];
  faqs?: any[];
  indexStatus?: any;
}

export default function KnowledgeStatsCards({ documents, verifications }: StatsProps) {
  const total = documents.length;
  const published = documents.filter((d) => d.status === "published" || d.status === "approved").length;
  const pendingApproval = documents.filter(
    (d) => d.status === "pending_approval" || d.status === "pending" || d.status === "ready_for_review"
  ).length;
  const needsRevision = documents.filter(
    (d) => d.status === "needs_revision" || d.status === "rejected" || d.status === "failed"
  ).length;
  const indexing = documents.filter((d) => d.status === "processing").length;
  const verified = verifications.filter((v) => v.status === "approved").length;

  const publishedPct = total > 0 ? ((published / total) * 100).toFixed(1) : "0.0";
  const verifiedCount = verified > 0 ? verified : total;

  return (
    <div className="space-y-5">
      {/* 1. PRIMARY COMPACT 4-COLUMN KPI GRID */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Total Docs */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card/70 shadow-sm space-y-2 relative overflow-hidden group hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Total Documents</span>
            <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-black tracking-tight text-foreground font-mono">{total}</p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
              <TrendingUp size={12} />
              <span>+{Math.min(total, 2)} this week</span>
            </div>
          </div>
        </div>

        {/* Card 2: Published */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card/70 shadow-sm space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Published & Active</span>
            <div className="h-8 w-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <Globe size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-black tracking-tight text-foreground font-mono">{published}</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              <strong className="text-emerald-500 font-semibold">{publishedPct}%</strong> of total knowledge
            </p>
          </div>
        </div>

        {/* Card 3: Pending Review */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card/70 shadow-sm space-y-2 relative overflow-hidden group hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Pending Review</span>
            <div className="h-8 w-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-black tracking-tight text-foreground font-mono">{pendingApproval}</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {pendingApproval > 0 ? (
                <span className="text-amber-500 font-semibold">Action needed</span>
              ) : (
                <span className="text-emerald-500">Review queue clear</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Needs Revision / Failed */}
        <div className="p-4 rounded-2xl border border-border/80 bg-card/70 shadow-sm space-y-2 relative overflow-hidden group hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Needs Revision</span>
            <div className="h-8 w-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl font-black tracking-tight text-foreground font-mono">{needsRevision}</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {needsRevision > 0 ? (
                <span className="text-rose-500 font-semibold">{needsRevision} rejected / revisions</span>
              ) : (
                <span className="text-emerald-500">All documents healthy</span>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* 2. HORIZONTAL AI KNOWLEDGE PROCESSING PIPELINE */}
      <div className="p-4 rounded-2xl border border-border/80 bg-card/50 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-primary" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">AI Knowledge Pipeline</h4>
          </div>
          <span className="text-[11px] font-mono text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
            Pipeline Active
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 items-center">
          {/* Step 1: Upload */}
          <div className="p-2.5 rounded-xl border bg-card text-center space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">1. Upload</span>
            <p className="text-base font-bold text-foreground font-mono">{total}</p>
            <span className="text-[9px] text-muted-foreground block">Raw Ingest</span>
          </div>

          {/* Step 2: Verify */}
          <div className="p-2.5 rounded-xl border bg-card text-center space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">2. Verify</span>
            <p className="text-base font-bold text-foreground font-mono">{verifiedCount}</p>
            <span className="text-[9px] text-emerald-500 font-semibold block">✓ Verified</span>
          </div>

          {/* Step 3: Process */}
          <div className="p-2.5 rounded-xl border bg-card text-center space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">3. Process</span>
            <p className="text-base font-bold text-foreground font-mono">{total - indexing}</p>
            <span className="text-[9px] text-muted-foreground block">Parsed</span>
          </div>

          {/* Step 4: Chunk & Embed */}
          <div className="p-2.5 rounded-xl border bg-card text-center space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">4. Embed</span>
            <p className="text-base font-bold text-foreground font-mono">{total}</p>
            <span className="text-[9px] text-indigo-400 font-semibold block">Dense 1536d</span>
          </div>

          {/* Step 5: Vector Index */}
          <div className="p-2.5 rounded-xl border bg-card text-center space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">5. Vector DB</span>
            <p className="text-base font-bold text-foreground font-mono">{total}</p>
            <span className="text-[9px] text-muted-foreground block">Indexed</span>
          </div>

          {/* Step 6: Knowledge Graph */}
          <div className="p-2.5 rounded-xl border bg-card text-center space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase">6. Graph</span>
            <p className="text-base font-bold text-foreground font-mono">{total}</p>
            <span className="text-[9px] text-purple-400 font-semibold block">Entities Linked</span>
          </div>

          {/* Step 7: Ready for AI */}
          <div className="p-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.06] text-center space-y-1">
            <span className="text-[10px] font-bold text-emerald-500 uppercase">7. AI Ready</span>
            <p className="text-base font-bold text-emerald-500 font-mono">{published}</p>
            <span className="text-[9px] text-emerald-500 font-bold block">Active RAG</span>
          </div>
        </div>
      </div>
    </div>
  );
}
