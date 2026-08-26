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
import { useEffect, useState } from "react";

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
  onUpdateMetadata,
  branches = [],
  documentTypes = [],
}: DocumentDetailSheetProps & {
  onUpdateMetadata?: (docId: string, metadata: any) => Promise<void>;
  branches?: any[];
  documentTypes?: any[];
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  const handleAddComment = async () => {
    if (!newCommentText.trim() || !doc?._id) return;
    setSubmittingComment(true);
    try {
      if (!doc.comments) doc.comments = [];
      doc.comments.push({
        text: newCommentText.trim(),
        created_at: new Date().toISOString(),
        user_name: "Admin",
      });
      if (onUpdateMetadata) {
        await onUpdateMetadata(doc._id, { comments: doc.comments });
      }
      setNewCommentText("");
    } catch {
      /* ignore */
    } finally {
      setSubmittingComment(false);
    }
  };

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editBranchId, setEditBranchId] = useState("");
  const [editDocTypeId, setEditDocTypeId] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);

  useEffect(() => {
    if (doc) {
      setEditTitle(doc.title || "");
      setEditDesc(doc.description || "");
      setEditBranchId(typeof doc.branch_id === "object" ? doc.branch_id?._id || "all" : doc.branch_id || "all");
      setEditDocTypeId(typeof doc.document_type_id === "object" ? doc.document_type_id?._id || "" : doc.document_type_id || "");
      const roles = Array.isArray(doc.allowed_roles) && doc.allowed_roles.length > 0
        ? doc.allowed_roles
        : [doc.assigned_role || "customer"];
      setEditRoles(roles);
    }
  }, [doc]);

  if (!doc) return null;

  const status = doc.status;
  const canReview = status === "pending_approval" || status === "pending";
  const canPublish = status === "approved";
  const canArchive = status === "published";

  const handleSaveMetadata = async () => {
    if (!onUpdateMetadata) return;
    setSaving(true);
    try {
      await onUpdateMetadata(doc._id, {
        title: editTitle,
        description: editDesc,
        branch_id: editBranchId,
        document_type: editDocTypeId || undefined,
        allowed_roles: editRoles,
      });
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update metadata:", err);
    } finally {
      setSaving(false);
    }
  };

  const toggleRole = (r: string) => {
    setEditRoles((prev) =>
      prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]
    );
  };

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
      value: Array.isArray(doc.allowed_roles) && doc.allowed_roles.length > 0 ? doc.allowed_roles.join(", ") : (doc.visibility || doc.assigned_role || "customer"),
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
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                <DocumentStatusBadge status={status} />
                <IndexStatusBadge doc={doc} />
                <VerificationStatusBadge verifications={verifications} documentId={doc._id} />
              </div>
              {onUpdateMetadata && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(!isEditing)}
                  className="h-7 text-xs px-2.5"
                >
                  {isEditing ? "Cancel Edit" : "Edit Metadata"}
                </Button>
              )}
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

            {isEditing ? (
              <div className="mt-3 p-4 rounded-xl border border-primary/30 bg-primary/5 space-y-3">
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Title</label>
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full text-sm rounded-lg border border-border px-3 py-1.5 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Description</label>
                  <textarea
                    value={editDesc}
                    rows={2}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full text-sm rounded-lg border border-border px-3 py-1.5 bg-background text-foreground"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Branch Scope</label>
                    <select
                      value={editBranchId}
                      onChange={(e) => setEditBranchId(e.target.value)}
                      className="w-full text-xs rounded-lg border border-border px-2 py-1.5 bg-background text-foreground"
                    >
                      <option value="all">All Branches (Global)</option>
                      {branches.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name || b.branch_name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Document Type</label>
                    <select
                      value={editDocTypeId}
                      onChange={(e) => setEditDocTypeId(e.target.value)}
                      className="w-full text-xs rounded-lg border border-border px-2 py-1.5 bg-background text-foreground"
                    >
                      <option value="">Default / None</option>
                      {documentTypes.map((dt) => (
                        <option key={dt._id} value={dt._id}>
                          {dt.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1.5">Role Visibility</label>
                  <div className="flex flex-wrap gap-2">
                    {["admin", "branch_admin", "support", "customer"].map((r) => {
                      const checked = editRoles.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => toggleRole(r)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                            checked
                              ? "bg-primary text-primary-foreground border-primary font-medium"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="pt-2 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveMetadata} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <SheetTitle className="text-lg leading-tight pr-8">{doc.title}</SheetTitle>
                <SheetDescription className="pr-8">
                  {doc.description || "No description provided."}
                </SheetDescription>
              </>
            )}
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

          {/* Interactive Document Notes & Comments */}
          <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
            <h4 className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>Document Notes & Comments</span>
              <span className="text-xs text-muted-foreground font-mono">
                {doc?.comments?.length || 0} comment(s)
              </span>
            </h4>

            {/* Existing Comments List */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {(!doc?.comments || doc.comments.length === 0) ? (
                <p className="text-xs text-muted-foreground italic text-center py-2 border border-dashed rounded-lg bg-muted/20">
                  No internal comments posted yet. Add a note below for collaborative review.
                </p>
              ) : (
                doc.comments.map((c: any, i: number) => (
                  <div key={i} className="p-2.5 rounded-lg border border-border bg-muted/30 text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-primary">{c.user_name || "Admin"}</span>
                      <span className="text-[10px] text-muted-foreground">{new Date(c.created_at || Date.now()).toLocaleString()}</span>
                    </div>
                    <p className="text-foreground">{c.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Add New Comment */}
            <div className="space-y-2 pt-2 border-t border-border">
              <textarea
                rows={2}
                placeholder="Add collaborative note or review comment..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddComment} disabled={!newCommentText.trim() || submittingComment} className="h-7 text-xs px-3">
                  {submittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            </div>
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
