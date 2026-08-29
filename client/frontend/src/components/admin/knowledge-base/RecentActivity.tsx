import { FileText, CheckCircle2, XCircle, RefreshCw, Globe, Archive, Clock, Sparkles } from "lucide-react";

interface ActivityItem {
  id: string;
  title: string;
  action: string;
  status?: string;
  actor?: string;
  date?: string;
  icon: any;
  className: string;
}

const ACTION_META: Record<string, { label: string; icon: any; className: string }> = {
  uploaded: { label: "uploaded", icon: FileText, className: "bg-blue-500/10 text-blue-500" },
  approved: { label: "approved", icon: CheckCircle2, className: "bg-green-500/10 text-green-500" },
  rejected: { label: "rejected", icon: XCircle, className: "bg-red-500/10 text-red-500" },
  needs_revision: { label: "requested revision", icon: RefreshCw, className: "bg-orange-500/10 text-orange-500" },
  published: { label: "published", icon: Globe, className: "bg-green-500/10 text-green-500" },
  archived: { label: "archived", icon: Archive, className: "bg-gray-500/10 text-gray-500" },
  pending_approval: { label: "submitted for review", icon: Clock, className: "bg-amber-500/10 text-amber-500" },
  ready_for_review: { label: "ready for review", icon: Clock, className: "bg-purple-500/10 text-purple-500" },
  processing: { label: "processing chunks", icon: RefreshCw, className: "bg-indigo-500/10 text-indigo-500" },
  draft: { label: "saved as draft", icon: FileText, className: "bg-slate-500/10 text-slate-500" },
  pending: { label: "submitted for review", icon: Clock, className: "bg-amber-500/10 text-amber-500" },
};

function timeAgo(dateString?: string) {
  if (!dateString) return "recently";
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

function buildActivity(documents: any[], verifications: any[]): ActivityItem[] {
  const items: ActivityItem[] = [];

  documents.forEach((doc) => {
    const meta = ACTION_META[doc.status] || { label: `status: ${doc.status}`, icon: FileText, className: "bg-slate-500/10 text-slate-500" };
    items.push({
      id: `doc-${doc._id}`,
      title: doc.title || "Untitled document",
      action: meta.label,
      status: doc.status,
      actor: doc.user_id?.name,
      date: doc.updated_at || doc.created_at,
      icon: meta.icon,
      className: meta.className,
    });
  });

  verifications.forEach((v) => {
    const status = v.status === "approved" ? "approved" : v.status === "rejected" ? "rejected" : "pending_approval";
    const meta = ACTION_META[status] || ACTION_META.uploaded;
    items.push({
      id: `ver-${v._id}`,
      title: v.document_id?.title || "Document",
      action: `${status === "pending_approval" ? "verification requested" : `verification ${meta.label}`}`,
      status: v.status,
      actor: v.verified_by?.name,
      date: v.updated_at || v.created_at,
      icon: meta.icon,
      className: meta.className,
    });
  });

  return items.sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 5);
}

export default function RecentActivity({ documents, verifications }: { documents: any[]; verifications: any[] }) {
  const activity = buildActivity(documents, verifications);

  if (activity.length === 0) {
    return (
      <div className="text-center py-6">
        <Sparkles size={24} className="mx-auto text-muted-foreground/30 mb-1.5" />
        <p className="text-xs text-muted-foreground">No recent activity logged</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {activity.map((item) => (
        <div key={item.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted/20 transition-colors">
          <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{item.title}</p>
            <p className="text-[11px] text-muted-foreground capitalize">
              {item.action} {item.actor ? `• ${item.actor}` : ""}
            </p>
          </div>
          <span className="text-[10px] font-mono text-muted-foreground shrink-0">
            {timeAgo(item.date)}
          </span>
        </div>
      ))}
    </div>
  );
}
