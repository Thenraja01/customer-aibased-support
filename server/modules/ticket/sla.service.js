import Ticket from "./ticket.schema.js";
import Organization from "../organization/organization.schema.js";
import { DEFAULT_SLA_TARGETS, SLA_WARNING_FRACTION } from "../../utils/constants.js";

/**
 * Load SLA targets (in minutes) for an organization, merging org-level
 * overrides on top of the priority defaults.
 */
export const getSlaTargets = async (organizationId) => {
  let orgSla = null;
  if (organizationId) {
    const org = await Organization.findById(organizationId).select("sla_settings").lean();
    orgSla = org?.sla_settings || null;
  }

  const targets = {};
  for (const priority of Object.keys(DEFAULT_SLA_TARGETS)) {
    const defaults = DEFAULT_SLA_TARGETS[priority];
    const override = orgSla?.[priority] || {};
    targets[priority] = {
      first_response_minutes: Number(override.first_response_minutes) || defaults.first_response_minutes,
      resolution_minutes: Number(override.resolution_minutes) || defaults.resolution_minutes,
    };
  }
  return targets;
};

/**
 * Compute SLA deadlines (first response + resolution) for a given priority.
 * Returns absolute Date objects.
 */
export const computeSlaDeadlines = (priority, targets) => {
  const config = (targets && targets[priority]) || DEFAULT_SLA_TARGETS[priority] || DEFAULT_SLA_TARGETS.medium;
  const now = new Date();
  return {
    first_response_due_at: new Date(now.getTime() + config.first_response_minutes * 60 * 1000),
    sla_due_at: new Date(now.getTime() + config.resolution_minutes * 60 * 1000),
  };
};

/**
 * Determine the current SLA state of a ticket at a point in time.
 *   on_track  — resolution deadline is far enough out
 *   warning   — less than SLA_WARNING_FRACTION of the window remains
 *   breached  — past the resolution deadline
 */
export const evaluateSlaStatus = (ticket, targets, now = new Date()) => {
  if (!ticket.sla_due_at) return "on_track";

  const nowMs = now.getTime();
  const dueMs = new Date(ticket.sla_due_at).getTime();
  if (nowMs >= dueMs) return "breached";

  const config = (targets && targets[ticket.priority]) || DEFAULT_SLA_TARGETS[ticket.priority] || DEFAULT_SLA_TARGETS.medium;
  const windowMs = config.resolution_minutes * 60 * 1000;
  const remainingMs = dueMs - nowMs;
  if (windowMs > 0 && remainingMs < windowMs * SLA_WARNING_FRACTION) return "warning";

  return "on_track";
};

/**
 * Apply SLA deadlines to a freshly created ticket payload.
 * Callers pass the priority; deadlines are computed and merged in.
 */
export const applySlaDeadlines = async (data) => {
  const targets = await getSlaTargets(data.organization_id);
  const deadlines = computeSlaDeadlines(data.priority || "medium", targets);
  return { ...data, ...deadlines, sla_status: "on_track" };
};

/**
 * Record the first response time on a ticket (once).
 */
export const markFirstResponse = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId).select("first_response_at first_response_due_at");
  if (!ticket) return null;
  if (!ticket.first_response_at) {
    ticket.first_response_at = new Date();
    await ticket.save({ timestamps: false });
  }
  return ticket;
};

/**
 * Recompute SLA deadlines after a priority change.
 */
export const recalculateSlaForPriority = async (ticketId, priority, organizationId) => {
  const targets = await getSlaTargets(organizationId);
  const deadlines = computeSlaDeadlines(priority, targets);
  return Ticket.findByIdAndUpdate(
    ticketId,
    { ...deadlines, priority, sla_status: "on_track" },
    { new: true }
  );
};

/**
 * Background sweep: mark tickets past their resolution deadline as breached
 * and flip warning state for those approaching the deadline. Runs periodically
 * from server.js. Only touches non-resolved/non-closed tickets.
 */
export const sweepSlaStatus = async (organizationId = null) => {
  const filter = {
    status: { $nin: ["resolved", "closed"] },
    sla_due_at: { $ne: null },
  };
  if (organizationId) filter.organization_id = organizationId;

  const targets = await getSlaTargets(organizationId);
  const tickets = await Ticket.find(filter)
    .select("_id priority sla_due_at sla_status sla_breached_at")
    .lean();

  const now = new Date();
  let updated = 0;
  for (const ticket of tickets) {
    const status = evaluateSlaStatus(ticket, targets, now);
    const patch = { sla_status: status };
    if (status === "breached" && !ticket.sla_breached_at) {
      patch.sla_breached_at = now;
    }
    if (status !== ticket.sla_status) {
      await Ticket.updateOne({ _id: ticket._id }, patch, { timestamps: false });
      updated += 1;
    }
  }
  return { scanned: tickets.length, updated };
};

/**
 * Attach SLA state (computed live) to a plain ticket object. Used when
 * serializing lists so the queue always reflects the current clock.
 */
export const decorateTicketSla = (ticket, targets) => {
  const sla_status = evaluateSlaStatus(ticket, targets);
  const remainingMs = ticket.sla_due_at ? new Date(ticket.sla_due_at).getTime() - Date.now() : null;
  return {
    ...ticket,
    sla_status,
    sla_remaining_ms: remainingMs && remainingMs > 0 ? remainingMs : 0,
    is_overdue: sla_status === "breached",
  };
};
