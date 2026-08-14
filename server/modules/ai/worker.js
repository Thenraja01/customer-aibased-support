import { getQueuedJobs, claimJob, completeJob, failJob, requeueStaleJobs } from "./ai.service.js";
import { processDocument } from "../document/document.service.js";

const WORKER_INTERVAL_MS = 10000; // 10 seconds
const STALE_JOB_AGE_MS = 5 * 60 * 1000; // 5 minutes
let isRunning = false;
let workerInterval = null;

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

    const jobs = await getQueuedJobs(5); // Process up to 5 jobs concurrently

    for (const job of jobs) {
      try {
        // Claim the job so other workers don't pick it up
        const claimedJob = await claimJob(job._id, "main-worker");
        if (!claimedJob) continue;

        console.log(`[Worker] Processing job ${claimedJob._id} of type ${claimedJob.job_type}`);

        if (claimedJob.job_type === "document_ingest") {
          const { documentId, versionId } = claimedJob.payload;
          if (!documentId || !versionId) {
            throw new Error("Missing documentId or versionId in job payload");
          }
          await processDocument(documentId, versionId);
        } else {
          // Handle other job types or ignore
          console.warn(`[Worker] Unhandled job type: ${claimedJob.job_type}`);
        }

        await completeJob(claimedJob._id, { success: true });
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
