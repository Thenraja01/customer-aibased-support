import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Eye,
  CheckCircle,
  XCircle,
  RefreshCw,
  Globe,
  Archive,
  Trash2,
  Clock,
  User,
  FileUp,
  Shield,
  Building2,
  Layers,
} from "lucide-react";
import {
  DocumentStatusBadge,
  IndexStatusBadge,
  VerificationStatusBadge,
  isDocumentStuck,
} from "./StatusBadges";

const formatFileSize = (bytes?: number | null) => {
  if (!bytes || bytes <= 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};

interface DocumentDetailSheetProps {
  doc: any;
  verifications: any[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onViewFile: (doc: any) => void;
  onApprove?: (doc: any) => void;
  onReject?: (doc: any) => void;
  onRequestRevision?: (doc: any) => void;
  onPublish?: (doc: any) => void;
  onArchive?: (doc: any) => void;
  onDelete?: (doc: any) => void;
  onUploadVersion?: (doc: any) => void;
  onRetryIngestion?: (doc: any) => void;
  onRefreshStatus?: (doc: any) => void;
}

function AuditTimeline({ doc, verifications }: { doc: any; verifications: any[] }) {
  const events: { date: string; label: string; icon: any; tone: string }[] = [];

  if (doc?.created_at) {
    events.push({
      date: doc.created_at,
      label: "Document uploaded",
      icon: FileUp,
      tone: "bg-blue-500/10 text-blue-500",
    });
  }
  if (doc?.updated_at && doc?.created_at && new Date(doc.updated_at) > new Date(doc.created_at)) {
    events.push({
      date: doc.updated_at,
      label: doc.status === "processing" ? "Re-indexing in progress" : "Document updated",
      icon: RefreshCw,
      tone: "bg-indigo-500/10 text-indigo-500",
    });
  }
  if (doc?.approved_at) {
    events.push({
      date: doc.approved_at,
      label: `Approved${doc.approved_by?.name ? ` by ${doc.approved_by.name}` : ""}`,
      icon: CheckCircle,
      tone: "bg-green-500/10 text-green-500",
    });
  }
  if (doc?.rejection_reason) {
    events.push({
      date: doc.updated_at,
      label: `Rejected${doc.rejection_reason ? `: ${doc.rejection_reason}` : ""}`,
      icon: XCircle,
      tone: "bg-red-500/10 text-red-500",
    });
  }

  verifications
    .filter((v) => String(v.document_id?._id || v.document_id) === String(doc?._id))
    .forEach((v) => {
      events.push({
        date: v.updated_at || v.created_at,
        label: `${v.status === "approved" ? "Verified" : v.status === "rejected" ? "Verification rejected" : "Verification requested"}${v.verified_by?.name ? ` by ${v.verified_by.name}` : ""}${v.remarks ? ` — ${v.remarks}` : ""}`,
        icon: v.status === "approved" ? CheckCircle : v.status === "rejected" ? XCircle : Clock,
        tone:
          v.status === "approved"
            ? "bg-green-500/10 text-green-500"
            : v.status === "rejected"
              ? "bg-red-500/10 text-red-500"
              : "bg-amber-500/10 text-amber-500",
      });
    });

  const sorted = events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sorted.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No activity recorded yet.</p>;
  }

  return (
    <div className="space-y-4 mt-2">
      {sorted.map((e, i) => (
        <div key={i} className="flex gap-3">
          <div className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 ${e.tone}`}>
            <e.icon size={13} />
          </div>
          <div className="min-w-0">
            <p className="text-sm">{e.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date(e.date).toLocaleString()}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function DocumentDetailSheet({
  doc,
  verifications,
  open,
  onOpenChange,
  onViewFile,
  onApprove,
  onReject,
  onRequestRevision,
  onPublish,
  onArchive,
  onDelete,
  onUploadVersion,
  onRetryIngestion,
  onRefreshStatus,
}: DocumentDetailSheetProps) {
  if (!doc) return null;

  const status = doc.status;
  const canReview = status === "pending_approval" || status === "pending";
  const canPublish = status === "approved";
  const canArchive = status === "published";

  const metaRows: { label: string; value: string; icon: any }[] = [
    {
      label: "Document Type",
      value: doc.document_type_id?.name || "—",
      icon: Layers,
    },
    {
      label: "Scope",
      value: !doc.branch_id ? "All Branches" : doc.branch_id?.name || doc.branch_id?.branch_name || "Branch Specific",
      icon: Building2,
    },
    {
      label: "Visibility",
      value: doc.visibility || doc.assigned_role || "—",
      icon: Shield,
    },
    {
      label: "Version",
      value: `v${doc.version_number || 1}`,
      icon: FileText,
    },
    {
      label: "File Size",
      value: formatFileSize(doc.file_size),
      icon: FileText,
    },
    {
      label: "Uploaded",
      value: doc.created_at ? new Date(doc.created_at).toLocaleString() : "—",
      icon: FileUp,
    },
    {
      label: "Uploaded By",
      value: doc.user_id?.name || "—",
      icon: User,
    },
    {
      label: "Last Updated",
      value: doc.updated_at ? new Date(doc.updated_at).toLocaleString() : "—",
      icon: Clock,
    },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <div className="pr-6">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <DocumentStatusBadge status={status} />
              <IndexStatusBadge doc={doc} />
              <VerificationStatusBadge verifications={verifications} documentId={doc._id} />
            </div>
            {isDocumentStuck(doc) && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2.5">
                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <Clock size={14} className="shrink-0 mt-0.5" />
                  <span>
                    Taking longer than expected. The document has been processing for a while. You can retry processing or refresh the status.
                  </span>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" onClick={() => onRefreshStatus?.(doc)}>
                    Refresh status
                  </Button>
                  <Button size="sm" onClick={() => onRetryIngestion?.(doc)}>
                    Retry
                  </Button>
                </div>
              </div>
            )}
            <SheetTitle className="text-lg leading-tight pr-8">{doc.title}</SheetTitle>
            <SheetDescription className="pr-8">
              {doc.description || "No description provided."}
            </SheetDescription>
          </div>
        </SheetHeader>

        <div className="px-6 space-y-6">
          {/* Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {metaRows.map((row) => (
              <div key={row.label} className="flex items-start gap-2.5">
                <row.icon size={15} className="text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{row.label}</p>
                  <p className="text-sm font-medium truncate" title={row.value}>{row.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Rejection reason */}
          {doc.rejection_reason && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3">
              <p className="text-xs font-medium text-red-600">Rejection Reason</p>
              <p className="text-sm mt-1">{doc.rejection_reason}</p>
            </div>
          )}

          {/* Audit timeline */}
          <div>
            <h3 className="text-sm font-semibold mb-1 flex items-center gap-1.5">
              <Clock size={14} className="text-muted-foreground" /> Activity Timeline
            </h3>
            <AuditTimeline doc={doc} verifications={verifications} />
          </div>

          {/* Versions */}
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Current Version</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  v{doc.version_number || 1} · {doc.file_name || "File"}
                </p>
              </div>
              {onUploadVersion && (
                <Button variant="outline" size="sm" onClick={() => onUploadVersion(doc)}>
                  <FileUp size={14} className="mr-1" /> Upload New Version
                </Button>
              )}
            </div>
          </div>

          {/* Comments (degraded) */}
          <div className="rounded-lg border border-dashed border-border px-4 py-3">
            <p className="text-sm font-semibold">Comments</p>
            <p className="text-xs text-muted-foreground mt-1">
              Comments and collaborative notes are not yet available for documents.
            </p>
          </div>
        </div>

        <SheetFooter className="mt-auto pt-6 border-t border-border">
          <div className="flex flex-wrap gap-2 w-full">
            <Button variant="outline" size="sm" onClick={() => onViewFile(doc)} className="flex-1">
              <Eye size={14} className="mr-1" /> View File
            </Button>
            {canReview && onApprove && (
              <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 flex-1" onClick={() => onApprove(doc)}>
                <CheckCircle size={14} className="mr-1" /> Approve
              </Button>
            )}
            {canReview && onReject && (
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => onReject(doc)}>
                <XCircle size={14} className="mr-1" /> Reject
              </Button>
            )}
            {canReview && onRequestRevision && (
              <Button size="sm" variant="outline" className="flex-1 text-amber-600 border-amber-500/30 hover:bg-amber-500/10" onClick={() => onRequestRevision(doc)}>
                <RefreshCw size={14} className="mr-1" /> Revision
              </Button>
            )}
            {status === "needs_revision" && (
              <>
                {onPublish && (
                  <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700 flex-1" onClick={() => onPublish(doc)}>
                    <RefreshCw size={14} className="mr-1" /> Re-process / Publish
                  </Button>
                )}
                {onApprove && (
                  <Button size="sm" className="bg-green-600 text-white hover:bg-green-700 flex-1" onClick={() => onApprove(doc)}>
                    <CheckCircle size={14} className="mr-1" /> Approve
                  </Button>
                )}
              </>
            )}
            {canPublish && onPublish && (
              <Button size="sm" className="flex-1 bg-green-600 text-white hover:bg-green-700" onClick={() => onPublish(doc)}>
                <Globe size={14} className="mr-1" /> Publish
              </Button>
            )}
            {canArchive && onArchive && (
              <Button size="sm" variant="outline" className="flex-1" onClick={() => onArchive(doc)}>
                <Archive size={14} className="mr-1" /> Archive
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="destructive" className="flex-1" onClick={() => onDelete(doc)}>
                <Trash2 size={14} className="mr-1" /> Delete
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
