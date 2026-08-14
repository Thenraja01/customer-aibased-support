import { Badge } from "@/components/ui/badge";

export const DOCUMENT_STATUS_META: Record<string, { label: string; className: string }> = {
  uploaded: {
    label: "Uploaded",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800/40",
  },
  processing: {
    label: "Processing",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40",
  },
  ready_for_review: {
    label: "Ready for Review",
    className: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800/40",
  },
  pending_approval: {
    label: "Pending Approval",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40",
  },
  approved: {
    label: "Approved",
    className: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400 border-teal-200 dark:border-teal-800/40",
  },
  rejected: {
    label: "Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/40",
  },
  needs_revision: {
    label: "Needs Revision",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/40",
  },
  published: {
    label: "Published",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/40",
  },
  archived: {
    label: "Archived",
    className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200 dark:border-gray-800/40",
  },
  pending: {
    label: "Pending Approval",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40",
  },
  draft: {
    label: "Draft",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800/40",
  },
};

export const INDEX_STATUS_META: Record<string, { label: string; className: string }> = {
  indexed: {
    label: "Indexed",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/40",
  },
  indexing: {
    label: "Indexing...",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40 animate-pulse",
  },
  failed: {
    label: "Indexing Failed",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/40",
  },
  queued: {
    label: "Queued",
    className: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40",
  },
  idle: {
    label: "Not Started",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800/40",
  },
  not_ingestible: {
    label: "No Extractable Content",
    className: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200 dark:border-orange-800/40",
  },
  not_indexed: {
    label: "Not Indexed",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800/40",
  },
};

export const VERIFICATION_STATUS_META: Record<string, { label: string; className: string }> = {
  pending: {
    label: "Verification Pending",
    className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800/40",
  },
  approved: {
    label: "Verified",
    className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200 dark:border-green-800/40",
  },
  rejected: {
    label: "Verification Rejected",
    className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200 dark:border-red-800/40",
  },
  not_verified: {
    label: "Not Verified",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800/40",
  },
};

// A document is "ingesting" while the background job has not finished. These
// are the non-terminal states of knowledge_index_status / ingestionStatus.
const INGESTING_STATUSES = new Set(["queued", "processing", "parsing", "chunking", "embedding", "indexing"]);

// How long a document may stay in an ingesting state before we surface the
// "Taking longer than expected" warning with Retry / Refresh actions.
export const STUCK_THRESHOLD_MS = 90_000;

export const isDocumentIngesting = (doc: any) => {
  if (!doc) return false;
  if (doc.status === "processing") return true;
  const knowledge = doc.knowledge_index_status;
  if (knowledge && INGESTING_STATUSES.has(knowledge)) return true;
  const ingestion = doc.ingestionStatus;
  if (ingestion && INGESTING_STATUSES.has(ingestion)) return true;
  return false;
};

// A document is "stuck" when it is still ingesting but has not progressed
// (updated_at / created_at) within STUCK_THRESHOLD_MS. Active processing keeps
// writing progress so it is never falsely flagged.
export const isDocumentStuck = (doc: any, now = Date.now()) => {
  if (!isDocumentIngesting(doc)) return false;
  const since = new Date(doc.updated_at || doc.created_at || now).getTime();
  if (Number.isNaN(since)) return false;
  return now - since > STUCK_THRESHOLD_MS;
};

export function DocumentStatusBadge({ status }: { status?: string }) {
  const meta = DOCUMENT_STATUS_META[status || ""] || {
    label: status || "Unknown",
    className: "bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400 border-slate-200 dark:border-slate-800/40",
  };
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}

export function IndexStatusBadge({ doc }: { doc: any }) {
  let status = "not_indexed";
  if (doc?.knowledge_index_status) {
    status = doc.knowledge_index_status;
  } else if (doc?.status === "published" || doc?.status === "approved") {
    status = "indexed";
  } else if (doc?.status === "processing") {
    status = "indexing";
  }
  const meta = INDEX_STATUS_META[status] || INDEX_STATUS_META.not_indexed;
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}

export function VerificationStatusBadge({ verifications, documentId }: { verifications: any[]; documentId: string }) {
  const v = verifications.find((item) => String(item.document_id?._id || item.document_id) === String(documentId));
  const status = v?.status || "not_verified";
  const meta = VERIFICATION_STATUS_META[status] || VERIFICATION_STATUS_META.not_verified;
  return (
    <Badge variant="outline" className={meta.className}>
      {meta.label}
    </Badge>
  );
}
