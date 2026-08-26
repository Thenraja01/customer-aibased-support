import {
  getQueuedJobs,
  claimJob,
  completeJob,
  failJob,
  requeueStaleJobs,
} from "../ai/ai.service.js";
import { assignTicket } from "./assignment.service.js";
import * as notifService from "../notification/notification.service.js";
import Ticket from "../ticket/ticket.schema.js";

const WORKER_INTERVAL_MS = 5000;
const STALE_JOB_AGE_MS = 5 * 60 * 1000;
const MAX_BATCH = 20;
let isRunning = false;
let workerInterval = null;

const notifyAssigned = async (ticket) => {
  if (!ticket?.assigned_to) return;
  const full = await Ticket.findById(ticket._id).populate("user_id", "name email").lean();
  await notifService.createNotification({
    user_id: ticket.assigned_to,
    title: "Ticket assigned to you",
    message: `You have been assigned "${ticket.subject}"`,
    type: "info",
    link: `/support/tickets/${ticket._id}`,
  }).catch(() => {});
  if (full?.user_id) {
    await notifService.createNotification({
      user_id: full.user_id._id,
      title: "Your ticket has been assigned",
      message: `Your ticket "${ticket.subject}" has been assigned to a support agent`,
      type: "info",
      link: `/tickets/${ticket._id}`,
    }).catch(() => {});
  }
};

const processAssignJobs = async () => {
  if (isRunning) return;
  isRunning = true;

  try {
    try {
      const requeued = await requeueStaleJobs(STALE_JOB_AGE_MS);
      if (requeued?.modifiedCount) {
        console.log(`[AssignmentWorker] Requeued ${requeued.modifiedCount} stale job(s)`);
      }
    } catch (err) {
      console.error("[AssignmentWorker] Requeue failed:", err.message);
    }

    const jobs = await getQueuedJobs(MAX_BATCH);
    const assignJobs = jobs.filter((j) => j.job_type === "ticket_assign");

    for (const job of assignJobs) {
      try {
        const claimed = await claimJob(job._id, "assignment-worker");
        if (!claimed) continue;

        const ticket = await assignTicket(job.related_id || job.payload?.ticketId, {
          strategy: job.payload?.strategy,
        });

        if (ticket?.assigned_to) {
          await notifyAssigned(ticket);
        }

        await completeJob(claimed._id, {
          assigned_to: ticket?.assigned_to || null,
          assigned: Boolean(ticket?.assigned_to),
        });
        console.log(`[AssignmentWorker] Completed job ${claimed._id} (assigned=${Boolean(ticket?.assigned_to)})`);
      } catch (err) {
        console.error(`[AssignmentWorker] Failed job ${job._id}:`, err.message);
        await failJob(job._id, err.message || "Unknown error", true);
      }
    }
  } catch (err) {
    console.error("[AssignmentWorker] Loop error:", err.message);
  } finally {
    isRunning = false;
  }
};

export const startAssignmentWorker = () => {
  if (workerInterval) return;
  console.log("[AssignmentWorker] Starting ticket assignment processor...");
  workerInterval = setInterval(processAssignJobs, WORKER_INTERVAL_MS);
  processAssignJobs();
};

export const stopAssignmentWorker = () => {
  if (workerInterval) {
    clearInterval(workerInterval);
    workerInterval = null;
    console.log("[AssignmentWorker] Stopped.");
  }
};