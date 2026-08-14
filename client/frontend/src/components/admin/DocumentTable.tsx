import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Trash2, CheckCircle, XCircle, RefreshCw, Globe, Archive } from "lucide-react";
import { DataTable } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { useMemo } from "react";

const statusVariant: Record<string, string> = {
  uploaded: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
  processing: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40",
  ready_for_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/40",
  pending_approval: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40",
  approved: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800/40",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/40",
  needs_revision: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/40",
  published: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/40",
  archived: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800/40",
  // Legacy
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40",
  draft: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800/40",
};

const statusLabel: Record<string, string> = {
  uploaded: "Uploaded",
  processing: "Processing",
  ready_for_review: "Ready for Review",
  pending_approval: "Pending Approval",
  approved: "Approved",
  rejected: "Rejected",
  needs_revision: "Needs Revision",
  published: "Published",
  archived: "Archived",
  pending: "Pending Approval",
  draft: "Draft",
};

export default function DocumentTable({
  documents,
  onView,
  onApprove,
  onReject,
  onRequestRevision,
  onPublish,
  onArchive,
  onDelete,
}: {
  documents: any[];
  onView: (doc: any) => void;
  onApprove?: (doc: any) => void;
  onReject?: (doc: any) => void;
  onRequestRevision?: (doc: any) => void;
  onPublish?: (doc: any) => void;
  onArchive?: (doc: any) => void;
  onDelete: (doc: any) => void;
}) {
  const getIndexStatusBadge = (doc: any) => {
    let status = "not_indexed";
    let label = "Not Indexed";
    let variant = "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800/40";

    if (doc.knowledge_index_status) {
      status = doc.knowledge_index_status;
    } else if (doc.status === "published" || doc.status === "approved") {
      status = "indexed";
    } else if (doc.status === "processing") {
      status = "indexing";
    }

    if (status === "indexed") {
      label = "Knowledge indexed";
      variant = "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/40";
    } else if (status === "indexing") {
      label = "Indexing knowledge...";
      variant = "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40 animate-pulse";
    } else if (status === "failed") {
      label = "Knowledge indexing failed";
      variant = "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/40";
    }

    return <Badge className={variant} variant="outline">{label}</Badge>;
  };

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "title",
      header: "Title",
      cell: ({ row }) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: "document_type_id.name",
      header: "Type",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.document_type_id?.name || "—"}</span>,
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <Badge className={statusVariant[doc.status] || ""} variant="outline">
            {statusLabel[doc.status] || doc.status}
          </Badge>
        );
      },
    },
    {
      accessorKey: "version_number",
      header: "Version",
      cell: ({ row }) => <span className="font-medium text-muted-foreground">v{row.original.version_number || 1}</span>,
    },
    {
      accessorKey: "branch_id",
      header: "Scope",
      cell: ({ row }) => {
        const doc = row.original;
        return (
          <Badge variant="outline">
            {doc.branch_id === null || doc.branch_id === undefined || !doc.branch_id
              ? "All Branches"
              : doc.branch_id.name || doc.branch_id.branch_name || "Branch Specific"}
          </Badge>
        );
      },
    },
    {
      id: "index_status",
      header: "Index Status",
      cell: ({ row }) => getIndexStatusBadge(row.original),
    },
    {
      accessorKey: "updated_at",
      header: "Updated At",
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.updated_at ? new Date(row.original.updated_at).toLocaleDateString() : "—"}</span>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      cell: ({ row }) => {
        const doc = row.original;
        const hasApprovalControls = doc.status === "pending_approval" || doc.status === "pending";

        return (
          <div className="flex items-center justify-end gap-1">
            {hasApprovalControls && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-green-600 hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => onApprove?.(doc)}
                  title="Approve"
                >
                  <CheckCircle size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => onReject?.(doc)}
                  title="Reject"
                >
                  <XCircle size={14} />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-amber-500 hover:text-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                  onClick={() => onRequestRevision?.(doc)}
                  title="Request Revision"
                >
                  <RefreshCw size={14} />
                </Button>
              </>
            )}
            {doc.status === "approved" && onPublish && (
              <Button
                variant="ghost"
                size="sm"
                className="text-green-600 hover:text-green-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={() => onPublish(doc)}
                title="Publish"
              >
                <Globe size={14} />
              </Button>
            )}
            {doc.status === "needs_revision" && (
              <>
                {onPublish && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-indigo-600 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => onPublish(doc)}
                    title="Retry / Force Publish"
                  >
                    <RefreshCw size={14} />
                  </Button>
                )}
                {onApprove && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-green-600 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                    onClick={() => onApprove(doc)}
                    title="Approve Document"
                  >
                    <CheckCircle size={14} />
                  </Button>
                )}
              </>
            )}
            {doc.status === "published" && onArchive && (
              <Button
                variant="ghost"
                size="sm"
                className="text-slate-500 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
                onClick={() => onArchive(doc)}
                title="Archive"
              >
                <Archive size={14} />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onView(doc)}
              title="View"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
            >
              <Eye size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              onClick={() => onDelete(doc)}
              title="Delete"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        );
      },
    }
  ], [onApprove, onReject, onRequestRevision, onPublish, onArchive, onView, onDelete]);

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No documents found.
      </div>
    );
  }

  return <DataTable columns={columns} data={documents} />;
}
