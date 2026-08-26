import { getQueuedJobs, claimJob, completeJob, failJob, requeueStaleJobs } from "./ai.service.js";
import { processDocument } from "../document/document.service.js";
import { sweepSlaStatus } from "../ticket/sla.service.js";
import { processIncidentNotification } from "../incident/index.js";

const WORKER_INTERVAL_MS = 10000; // 10 seconds
const STALE_JOB_AGE_MS = 5 * 60 * 1000; // 5 minutes

// Job types this worker owns. Assignment jobs are handled by the dedicated
// assignment worker (modules/assignment/assignment.worker.js).
const HANDLED_JOB_TYPES = new Set([
  "document_ingest",
  "embedding_generate",
  "embedding_reindex",
  "email_send",
  "notification_send",
  "knowledge_sync",
  "knowledge_gap_resolution",
  "conversation_summarize",
  "ai_feedback_analysis",
  "sla_sweep",
  "ticket_notification",
  "incident_notify",
]);

let isRunning = false;
let workerInterval = null;

const processJob = async (job) => {
  switch (job.job_type) {
    case "document_ingest": {
      const { documentId, versionId } = job.payload;
      if (!documentId || !versionId) {
        throw new Error("Missing documentId or versionId in job payload");
      }
      await processDocument(documentId, versionId);
      break;
    }
    case "sla_sweep": {
      const result = await sweepSlaStatus(job.organization_id || null);
      return { scanned: result.scanned, updated: result.updated };
    }
    case "incident_notify": {
      return await processIncidentNotification(job);
    }
    case "ticket_notification": {
      // Notification dispatch is delegated to the notification delivery
      // service at enqueue time; this job type is reserved for heavy fan-out.
      return { delegated: true };
    }
    default:
      // Document embedding, knowledge sync, email, etc. — reserved processors.
      console.warn(`[Worker] No processor registered for job type: ${job.job_type}`);
      return { skipped: true };
  }
};

const processJobs = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    // Recover jobs orphaned by a previous crash/restart so documents never
    // stay stuck in "processing" without an active worker.
    try {
      const requeued = await requeueStaleJobs(STALE_JOB_AGE_MS);
      if (requeued?.modifiedCount) {
        console.log(`[Worker] Requeued ${requeued.modifiedCount} stale processing job(s)`);
      }
    } catch (err) {
      console.error("[Worker] Failed to requeue stale jobs:", err.message);
    }

    const jobs = await getQueuedJobs(10);
    const ownedJobs = jobs.filter((j) => HANDLED_JOB_TYPES.has(j.job_type));

    for (const job of ownedJobs) {
      try {
        // Claim the job so other workers don't pick it up
        const claimedJob = await claimJob(job._id, "main-worker");
        if (!claimedJob) continue;

        console.log(`[Worker] Processing job ${claimedJob._id} of type ${claimedJob.job_type}`);

        const result = await processJob(claimedJob);

        await completeJob(claimedJob._id, { success: true, ...result });
        console.log(`[Worker] Completed job ${claimedJob._id}`);
      } catch (err) {
        console.error(`[Worker] Failed job ${job._id}:`, err);
        await failJob(job._id, err.message || "Unknown error", true);
      }
    }
  } catch (err) {
    console.error("[Worker] Error in job processing loop:", err);
  } finally {
    isRunning = false;
  }
};

export const startWorker = () => {
  if (workerInterval) return;
  console.log("[Worker] Starting background job processor...");
  workerInterval = setInterval(processJobs, WORKER_INTERVAL_MS);

  // Also run immediately on startup
  processJobs();
};

export const stopWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log("[Worker] Stopped background job processor.");
  }
};