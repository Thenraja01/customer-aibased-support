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
  StopCircle,
  AlertTriangle,
  Sparkles,
  Check,
  Loader2,
} from "lucide-react";
import {
  DocumentStatusBadge,
  IndexStatusBadge,
  VerificationStatusBadge,
  isDocumentStuck,
} from "./StatusBadges";
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";

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
  onAbortProcessing?: (doc: any) => void;
  onRefreshStatus?: (doc: any) => void;
}

// ── Ingestion Pipeline Stepper ──────────────────────────────────────────
function IngestionPipelineStepper({ doc }: { doc: any }) {
  if (!doc) return null;

  const isComplete = doc.knowledge_index_status === "indexed";
  const isFailed = doc.knowledge_index_status === "failed" || doc.ingestionStatus === "failed" || doc.knowledge_index_status === "not_ingestible";
  const stage = doc.ingestionStatus || doc.knowledge_index_status || "queued";

  const steps = [
    {
      id: "upload",
      name: "Upload",
      status: "complete",
    },
    {
      id: "extract",
      name: "Extract Text",
      status: isComplete || ["chunking", "embedding", "indexed"].includes(stage) || (doc.chunk_count && doc.chunk_count > 0)
        ? "complete"
        : isFailed && doc.failed_stage === "extract"
        ? "failed"
        : stage === "parsing"
        ? "active"
        : "pending",
    },
    {
      id: "chunking",
      name: "Chunking",
      status: isComplete || ["embedding", "indexed"].includes(stage) || (doc.chunk_count && doc.chunk_count > 0)
        ? "complete"
        : isFailed && doc.failed_stage === "chunk"
        ? "failed"
        : stage === "chunking"
        ? "active"
        : "pending",
    },
    {
      id: "topics",
      name: "Topics & Graph",
      status: isComplete || doc.topicStatus === "detected" || (doc.topics && doc.topics.length > 0)
        ? "complete"
        : doc.topicStatus === "detecting"
        ? "active"
        : isComplete
        ? "complete"
        : "pending",
    },
    {
      id: "embedding",
      name: "Vector Indexing",
      status: isComplete
        ? "complete"
        : isFailed
        ? "failed"
        : stage === "embedding" || doc.knowledge_index_status === "indexing"
        ? "active"
        : "pending",
    },
  ];

  return (
    <div className="rounded-xl border border-border/80 bg-card/60 p-3.5 shadow-sm space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
          <Sparkles size={13} className="text-primary" />
          <span>Ingestion Pipeline Flow</span>
        </div>
        {doc.chunk_count > 0 && (
          <span className="text-[11px] font-mono text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {doc.chunk_count} Chunks
          </span>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1.5">
        {steps.map((s, idx) => {
          let badgeClass = "bg-muted/40 text-muted-foreground border-border/40";
          let icon = <span className="text-[10px] font-mono">{idx + 1}</span>;

          if (s.status === "complete") {
            badgeClass = "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-medium";
            icon = <Check size={11} className="stroke-[3]" />;
          } else if (s.status === "active") {
            badgeClass = "bg-primary/15 text-primary border-primary/40 font-semibold animate-pulse";
            icon = <Loader2 size={11} className="animate-spin" />;
          } else if (s.status === "failed") {
            badgeClass = "bg-destructive/15 text-destructive border-destructive/30 font-medium";
            icon = <XCircle size={11} />;
          }

          return (
            <div
              key={s.id}
              className={`flex flex-col items-center justify-center text-center p-1.5 rounded-lg border text-[11px] transition-all ${badgeClass}`}
            >
              <div className="mb-0.5 flex h-4 w-4 items-center justify-center rounded-full">
                {icon}
              </div>
              <span className="truncate w-full leading-tight font-medium scale-95">{s.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
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

  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-3">
      {events.map((e, idx) => (
        <div key={idx} className="flex items-start gap-2.5">
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
  onAbortProcessing,
  onRefreshStatus,
  onUpdateMetadata,
  branches = [],
  documentTypes = [],
}: DocumentDetailSheetProps & {
  onUpdateMetadata?: (docId: string, metadata: any) => Promise<void>;
  branches?: any[];
  documentTypes?: any[];
}) {
  const toast = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isReprocessing, setIsReprocessing] = useState(false);
  const [isAborting, setIsAborting] = useState(false);

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
      toast.success("Comment added", "Note was saved to the document.");
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || err?.message || "Failed to save comment");
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
  const isIngesting = doc.status === "processing" || doc.ingestionStatus === "processing" || doc.knowledge_index_status === "indexing" || doc.ingestionStatus === "queued";

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
      toast.success("Document updated", "Metadata changes saved successfully.");
    } catch (err: any) {
      toast.error("Error", err?.response?.data?.message || err?.message || "Failed to save metadata changes");
    } finally {
      setSaving(false);
    }
  };

  const handleForceReprocess = async () => {
    if (!onRetryIngestion) return;
    setIsReprocessing(true);
    try {
      await onRetryIngestion(doc);
    } finally {
      setIsReprocessing(false);
    }
  };

  const handleAbort = async () => {
    if (!onAbortProcessing) return;
    setIsAborting(true);
    try {
      await onAbortProcessing(doc);
    } finally {
      setIsAborting(false);
    }
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

            {/* Quick Recovery Action Toolbar */}
            <div className="mt-2.5 flex items-center gap-2 p-2 rounded-xl border border-border/80 bg-muted/30">
              <Button
                variant="outline"
                size="sm"
                onClick={handleForceReprocess}
                disabled={isReprocessing}
                className="h-7 text-xs px-2.5 font-semibold text-primary border-primary/30 hover:bg-primary/10 flex-1"
              >
                <RefreshCw size={12} className={`mr-1.5 ${isReprocessing ? "animate-spin" : ""}`} />
                Force Reprocess
              </Button>
              {isIngesting && onAbortProcessing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAbort}
                  disabled={isAborting}
                  className="h-7 text-xs px-2.5 font-medium text-destructive border-destructive/30 hover:bg-destructive/10"
                >
                  <StopCircle size={12} className="mr-1.5" />
                  Abort Ingestion
                </Button>
              )}
              {onRefreshStatus && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRefreshStatus(doc)}
                  className="h-7 text-xs px-2"
                  title="Refresh live document status"
                >
                  <RefreshCw size={12} />
                </Button>
              )}
            </div>

            {/* Ingestion Error Alert if any */}
            {doc.ingestion_error && (
              <div className="mt-3 p-3 rounded-xl border border-destructive/40 bg-destructive/10 flex items-start gap-2.5 text-xs text-destructive">
                <AlertTriangle size={15} className="shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold">Ingestion Issue Detected</p>
                  <p className="text-[11px] opacity-90 mt-0.5">{doc.ingestion_error}</p>
                </div>
              </div>
            )}

            {/* Stuck Warning if taking too long */}
            {isDocumentStuck(doc) && !doc.ingestion_error && (
              <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-400/40 bg-amber-500/10 px-3 py-2.5">
                <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                  <Clock size={14} className="shrink-0 mt-0.5" />
                  <span>Taking longer than expected. You can trigger force reprocess or abort.</span>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" className="h-7 text-xs px-2" onClick={handleForceReprocess} disabled={isReprocessing}>
                    Reprocess
                  </Button>
                </div>
              </div>
            )}

            {/* 5-Stage Ingestion Pipeline Stepper */}
            <div className="mt-3">
              <IngestionPipelineStepper doc={doc} />
            </div>

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
                    rows={2}
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    className="w-full text-sm rounded-lg border border-border px-3 py-1.5 bg-background text-foreground resize-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Branch</label>
                  <select
                    value={editBranchId}
                    onChange={(e) => setEditBranchId(e.target.value)}
                    className="w-full text-sm rounded-lg border border-border px-3 py-1.5 bg-background text-foreground"
                  >
                    <option value="all">All Branches</option>
                    {branches.map((b: any) => (
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
                    className="w-full text-sm rounded-lg border border-border px-3 py-1.5 bg-background text-foreground"
                  >
                    <option value="">Select a type...</option>
                    {documentTypes.map((dt: any) => (
                      <option key={dt._id} value={dt._id}>
                        {dt.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase text-muted-foreground block mb-1">Visibility Roles</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["admin", "branch_admin", "support", "customer"].map((r) => {
                      const selected = editRoles.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => {
                            if (selected) {
                              setEditRoles(editRoles.filter((x) => x !== r));
                            } else {
                              setEditRoles([...editRoles, r]);
                            }
                          }}
                          className={`text-xs px-2.5 py-1 rounded-md border transition-all ${
                            selected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                          }`}
                        >
                          {r}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSaveMetadata} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <SheetTitle className="text-lg font-bold mt-3 leading-tight">{doc.title}</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground mt-1">
                  {doc.description || "No description provided."}
                </SheetDescription>
              </>
            )}
          </div>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* AI Context Summary (Fast LLM Retrieval) */}
          {(doc.summary || doc.context_summary) && (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <Sparkles size={13} />
                <span>AI Context Summary (Fast LLM Cache)</span>
              </div>
              <p className="text-xs leading-relaxed text-foreground whitespace-pre-line">
                {doc.summary || doc.context_summary}
              </p>
            </div>
          )}

          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-3">
            {metaRows.map((row, idx) => (
              <div key={idx} className="p-3 rounded-xl border border-border/70 bg-card/40 space-y-1">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <row.icon size={13} />
                  <span className="text-[11px] uppercase tracking-wider font-semibold">{row.label}</span>
                </div>
                <p className="text-xs font-medium truncate" title={row.value}>
                  {row.value}
                </p>
              </div>
            ))}
          </div>

          {/* Activity Timeline */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
              <Clock size={13} />
              Activity Timeline
            </h4>
            <div className="p-4 rounded-xl border border-border/70 bg-card/40">
              <AuditTimeline doc={doc} verifications={verifications} />
            </div>
          </div>

          {/* Version Info & Uploader */}
          <div className="p-4 rounded-xl border border-border/70 bg-card/40 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Current Version</p>
                <p className="text-sm font-semibold mt-0.5">
                  v{doc.version_number || 1} <span className="text-muted-foreground font-normal">· {doc.file_name}</span>
                </p>
              </div>
              {onUploadVersion && (
                <Button variant="outline" size="sm" onClick={() => onUploadVersion(doc)} className="text-xs h-8">
                  <FileUp size={13} className="mr-1" /> Upload Version
                </Button>
              )}
            </div>
          </div>

          {/* Document Notes & Comments */}
          <div className="p-4 rounded-xl border border-border/70 bg-card/40 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Document Notes & Comments <span className="font-normal font-mono">({doc.comments?.length || 0})</span>
            </p>
            {doc.comments && doc.comments.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {doc.comments.map((c: any, idx: number) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-background/80 border border-border text-xs space-y-1">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                      <span className="font-medium text-foreground">{c.user_name || "Admin"}</span>
                      <span>{c.created_at ? new Date(c.created_at).toLocaleTimeString() : ""}</span>
                    </div>
                    <p className="text-foreground leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic text-center py-2 border border-dashed rounded-lg">
                No internal comments posted yet. Add a note below for collaborative review.
              </p>
            )}

            <div className="flex gap-2 pt-1">
              <input
                type="text"
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Write an internal note..."
                className="flex-1 text-xs rounded-lg border border-border px-3 py-2 bg-background text-foreground"
              />
              <Button size="sm" onClick={handleAddComment} disabled={submittingComment || !newCommentText.trim()} className="text-xs h-9">
                Post Note
              </Button>
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
