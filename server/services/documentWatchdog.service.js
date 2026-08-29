import Document from "../modules/document/document.schema.js";
import { retryDocumentIngestion } from "../modules/document/document.service.js";
import { notifyAdminsOnSystemError } from "../modules/notification/notification.service.js";

const STUCK_THRESHOLD_MS = 3 * 60 * 1000; // 3 minutes without update
const MAX_AUTO_RETRIES = 3;

/**
 * Self-Healing Watchdog for Knowledge Base Document Ingestion.
 * Detects stalled jobs (e.g. from server restarts, worker timeouts) and automatically recovers them.
 */
export const runDocumentWatchdog = async () => {
  try {
    const thresholdDate = new Date(Date.now() - STUCK_THRESHOLD_MS);

    // Query documents stalled in processing, indexing, or queued state
    const stuckDocs = await Document.find({
      $or: [
        { status: "processing", updated_at: { $lt: thresholdDate } },
        { ingestionStatus: "processing", updated_at: { $lt: thresholdDate } },
        { knowledge_index_status: "indexing", updated_at: { $lt: thresholdDate } },
        { ingestionStatus: "queued", updated_at: { $lt: thresholdDate } },
      ],
    });

    if (stuckDocs.length === 0) return;

    console.log(`[DocumentWatchdog] Found ${stuckDocs.length} stalled document(s). Initiating auto-recovery...`);

    for (const doc of stuckDocs) {
      const currentRetries = doc.retry_count || 0;

      if (currentRetries < MAX_AUTO_RETRIES) {
        console.log(`[DocumentWatchdog] Auto-recovering doc "${doc.title}" (ID: ${doc._id}) - Attempt ${currentRetries + 1}/${MAX_AUTO_RETRIES}`);
        doc.retry_count = currentRetries + 1;
        doc.ingestion_error = `Stalled job auto-recovered by Watchdog at ${new Date().toLocaleTimeString()} (Attempt ${doc.retry_count}/${MAX_AUTO_RETRIES})`;
        await doc.save();

        try {
          await retryDocumentIngestion(doc._id, doc.organization_id, doc.branch_id);
        } catch (retryErr) {
          console.error(`[DocumentWatchdog] Failed to re-enqueue doc ${doc._id}:`, retryErr.message);
        }
      } else {
        // Max retries reached — safely park document in needs_revision and notify admins
        console.warn(`[DocumentWatchdog] Doc "${doc.title}" exceeded max auto-retries. Marking as failed.`);
        doc.status = "needs_revision";
        doc.ingestionStatus = "failed";
        doc.indexingStatus = "failed";
        doc.knowledge_index_status = "failed";
        doc.ingestion_error = "Document processing stalled repeatedly. Please verify file format or re-upload.";
        doc.failed_stage = "watchdog_timeout";
        await doc.save();

        await notifyAdminsOnSystemError({
          organizationId: doc.organization_id,
          title: "Document Ingestion Stalled",
          message: `Document "${doc.title}" could not complete background indexing after ${MAX_AUTO_RETRIES} attempts. Action required.`,
          type: "warning",
          link: "/admin/knowledge",
        }).catch(() => null);
      }
    }
  } catch (err) {
    console.error("[DocumentWatchdog] Watchdog scan encountered error:", err.message);
  }
};
