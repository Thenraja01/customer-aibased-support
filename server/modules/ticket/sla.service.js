import Ticket from "./ticket.schema.js";
import Organization from "../organization/organization.schema.js";
import { DEFAULT_SLA_TARGETS, SLA_WARNING_FRACTION } from "../../utils/constants.js";

const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/**
 * Add active working minutes to a start date, skipping off-hours, closed days, and weekends
 * based on the organization's working_hours configuration.
 */
export const addWorkingMinutes = (startDate, minutes, workingHoursConfig = null) => {
  const start = new Date(startDate);
  if (!minutes || minutes <= 0) return start;

  // Check if workingHoursConfig has valid enabled days with open/close times
  let isWorkingHoursActive = false;
  if (workingHoursConfig && typeof workingHoursConfig === "object") {
    for (const day of DAY_NAMES) {
      if (workingHoursConfig[day]?.enabled && workingHoursConfig[day]?.open && workingHoursConfig[day]?.close) {
        isWorkingHoursActive = true;
        break;
      }
    }
  }

  // Fallback to standard 24/7 calendar calculation if working hours are not enabled or configured
  if (!isWorkingHoursActive) {
    return new Date(start.getTime() + minutes * 60 * 1000);
  }

  let current = new Date(start.getTime());
  let remainingMinutes = minutes;
  let maxDaysGuard = 365;

  while (remainingMinutes > 0 && maxDaysGuard > 0) {
    maxDaysGuard--;
    const dayName = DAY_NAMES[current.getDay()];
    const daySchedule = workingHoursConfig[dayName];

    if (daySchedule && daySchedule.enabled && daySchedule.open && daySchedule.close) {
      const [openH, openM] = daySchedule.open.split(":").map(Number);
      const [closeH, closeM] = daySchedule.close.split(":").map(Number);

      const openTime = new Date(current.getFullYear(), current.getMonth(), current.getDate(), openH, openM, 0, 0);
      const closeTime = new Date(current.getFullYear(), current.getMonth(), current.getDate(), closeH, closeM, 0, 0);

      if (current < openTime) {
        current = openTime;
      }

      if (current < closeTime) {
        const availableMins = (closeTime.getTime() - current.getTime()) / (60 * 1000);
        if (remainingMinutes <= availableMins) {
          current = new Date(current.getTime() + remainingMinutes * 60 * 1000);
          remainingMinutes = 0;
          break;
        } else {
          remainingMinutes -= availableMins;
          current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);
        }
      } else {
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);
      }
    } else {
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1, 0, 0, 0, 0);
    }
  }

  return current;
};

/**
 * Load SLA targets (in minutes) for an organization, merging org-level
 * overrides on top of the priority defaults and attaching working_hours.
 */
export const getSlaTargets = async (organizationId) => {
  let orgSla = null;
  let workingHours = null;
  let warningPct = 50;
  if (organizationId) {
    const org = await Organization.findById(organizationId).select("sla_settings working_hours sla_warning_threshold_pct").lean();
    orgSla = org?.sla_settings || null;
    workingHours = org?.working_hours || null;
    warningPct = Number(org?.sla_warning_threshold_pct ?? orgSla?.warning_threshold_pct ?? 50);
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

  targets.workingHours = workingHours;
  targets.warning_threshold_pct = warningPct;

  return targets;
};

/**
 * Compute SLA deadlines (first response + resolution) for a given priority.
 * Uses organization working hours if configured. Returns absolute Date objects.
 */
export const computeSlaDeadlines = (priority, targets, startDate = new Date()) => {
  const config = (targets && targets[priority]) || DEFAULT_SLA_TARGETS[priority] || DEFAULT_SLA_TARGETS.medium;
  const workingHours = targets?.workingHours || null;

  return {
    first_response_due_at: addWorkingMinutes(startDate, config.first_response_minutes, workingHours),
    sla_due_at: addWorkingMinutes(startDate, config.resolution_minutes, workingHours),
  };
};

/**
 * Determine the current SLA state of a ticket at a point in time.
 *   on_track  — resolution deadline is far enough out
 *   warning   — remaining SLA window is below warning_threshold_pct (e.g. 50%)
 *   breached  — past the resolution deadline
 */
export const evaluateSlaStatus = (ticket, targets, now = new Date()) => {
  if (!ticket.sla_due_at) return "on_track";

  const nowMs = now.getTime();
  const dueMs = new Date(ticket.sla_due_at).getTime();
  if (nowMs >= dueMs) return "breached";

  const warningFraction = ((targets?.warning_threshold_pct ?? 50) / 100);
  const config = (targets && targets[ticket.priority]) || DEFAULT_SLA_TARGETS[ticket.priority] || DEFAULT_SLA_TARGETS.medium;
  const windowMs = config.resolution_minutes * 60 * 1000;
  const remainingMs = dueMs - nowMs;
  if (windowMs > 0 && remainingMs < windowMs * warningFraction) return "warning";

  return "on_track";
};

/**
 * Apply SLA deadlines to a freshly created ticket payload.
 * Callers pass the priority; deadlines are computed and merged in.
 */
export const applySlaDeadlines = async (data) => {
  const targets = await getSlaTargets(data.organization_id);
  const deadlines = computeSlaDeadlines(data.priority || "medium", targets, new Date());
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
    .select("_id priority sla_due_at sla_status sla_breached_at organization_id branch_id ticket_number assigned_agent assigned_to title subject")
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

      // Dispatch SLA warning/breach events over Socket.io and Notification Service
      try {
        const { getIO } = await import("../../config/socket.js");
        const io = getIO();
        const eventName = status === "breached" ? "sla_breach" : "sla_warning";
        const payload = {
          ticketId: ticket._id,
          ticketNumber: ticket.ticket_number,
          priority: ticket.priority,
          slaStatus: status,
          organizationId: ticket.organization_id,
          branchId: ticket.branch_id,
          timestamp: now.toISOString(),
        };

        if (ticket.organization_id) io.to(`org:${ticket.organization_id}`).emit(eventName, payload);
        if (ticket.branch_id) io.to(`branch:${ticket.branch_id}`).emit(eventName, payload);
        io.to(`ticket:${ticket._id}`).emit(eventName, payload);

        // Notify assigned support agent if present
        const assignedUserId = ticket.assigned_agent || ticket.assigned_to;
        const { createNotification } = await import("../notification/notification.service.js");

        if (assignedUserId) {
          await createNotification({
            user_id: assignedUserId,
            organization_id: ticket.organization_id,
            branch_id: ticket.branch_id,
            title: status === "breached" ? `SLA Breached: Ticket #${ticket.ticket_number}` : `SLA Warning: Ticket #${ticket.ticket_number}`,
            message: status === "breached"
              ? `Ticket #${ticket.ticket_number} (${ticket.title || ticket.subject || 'No subject'}) has breached SLA.`
              : `Ticket #${ticket.ticket_number} (${ticket.title || ticket.subject || 'No subject'}) is approaching SLA breach deadline.`,
            type: status === "breached" ? "error" : "warning",
            link: `/support/tickets/${ticket._id}`,
          }).catch(() => {});
        }

        // On SLA breach, escalate alert to Branch Admin / Org Admin supervision
        if (status === "breached") {
          try {
            const User = (await import("../user/user.schema.js")).default;
            const adminFilter = {
              organization_id: ticket.organization_id,
              role: { $in: ["branch_admin", "admin"] },
              status: "active",
            };
            if (ticket.branch_id) {
              adminFilter.$or = [{ branch_id: ticket.branch_id }, { role: "admin" }];
            }
            const adminsToNotify = await User.find(adminFilter).select("_id role").lean();
            for (const adminUser of adminsToNotify) {
              if (String(adminUser._id) !== String(assignedUserId)) {
                await createNotification({
                  user_id: adminUser._id,
                  organization_id: ticket.organization_id,
                  branch_id: ticket.branch_id,
                  title: `🔥 Ticket Escalated (SLA Breached): #${ticket.ticket_number}`,
                  message: `Unresolved ticket #${ticket.ticket_number} has breached SLA. Action required by ${adminUser.role === "branch_admin" ? "Branch Admin" : "Org Admin"}.`,
                  type: "error",
                  link: adminUser.role === "branch_admin" ? `/branch/tickets/${ticket._id}` : `/admin/queue`,
                }).catch(() => {});
              }
            }
          } catch {
            // Admin query fallback
          }
        }
      } catch {
        // Socket/Notification engine offline or isolated in test environment
      }
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

/**
 * Background sweep: Automatically close tickets that have been in "resolved"
 * status past the organization's auto-close grace period (closing_period_hours).
 * Default grace period is 48 hours if omitted.
 */
export const sweepAutoCloseTickets = async (organizationId = null) => {
  const filter = {
    status: "resolved",
    resolved_at: { $exists: true, $ne: null },
  };
  if (organizationId) filter.organization_id = organizationId;

  const tickets = await Ticket.find(filter)
    .select("_id resolved_at organization_id branch_id ticket_number user_id assigned_to subject title")
    .lean();

  if (!tickets || tickets.length === 0) return { scanned: 0, closed: 0 };

  const orgConfigMap = new Map();
  const now = new Date();
  let closed = 0;

  for (const ticket of tickets) {
    const orgIdKey = ticket.organization_id ? String(ticket.organization_id) : "default";

    if (!orgConfigMap.has(orgIdKey)) {
      let config = { enabled: true, closing_period_hours: 48 };
      if (ticket.organization_id) {
        const org = await Organization.findById(ticket.organization_id)
          .select("auto_close_settings")
          .lean();
        if (org && org.auto_close_settings) {
          config = {
            enabled: org.auto_close_settings.enabled !== false,
            closing_period_hours: Number(org.auto_close_settings.closing_period_hours) || 48,
          };
        }
      }
      orgConfigMap.set(orgIdKey, config);
    }

    const autoCloseConfig = orgConfigMap.get(orgIdKey);
    if (!autoCloseConfig || autoCloseConfig.enabled === false) {
      continue;
    }

    const periodHours = autoCloseConfig.closing_period_hours || 48;
    const cutoffTime = new Date(now.getTime() - periodHours * 60 * 60 * 1000);

    if (new Date(ticket.resolved_at) <= cutoffTime) {
      const closeReason = `Auto-closed after ${periodHours} hours of resolution without further customer activity.`;
      
      await Ticket.updateOne(
        { _id: ticket._id, status: "resolved" },
        {
          $set: {
            status: "closed",
            closed_at: now,
            close_reason: closeReason,
          },
        }
      );
      closed += 1;

      // Dispatch Socket and Notification events
      try {
        const { getIO } = await import("../../config/socket.js");
        const io = getIO();
        const payload = {
          ticketId: ticket._id,
          ticketNumber: ticket.ticket_number,
          status: "closed",
          closeReason,
          organizationId: ticket.organization_id,
          branchId: ticket.branch_id,
          timestamp: now.toISOString(),
        };

        if (ticket.organization_id) io.to(`org:${ticket.organization_id}`).emit("ticket_auto_closed", payload);
        if (ticket.branch_id) io.to(`branch:${ticket.branch_id}`).emit("ticket_auto_closed", payload);
        io.to(`ticket:${ticket._id}`).emit("ticket_auto_closed", payload);

        const { createNotification } = await import("../notification/notification.service.js");
        if (ticket.user_id) {
          await createNotification({
            user_id: ticket.user_id,
            organization_id: ticket.organization_id,
            branch_id: ticket.branch_id,
            title: `Ticket #${ticket.ticket_number} Auto-Closed`,
            message: `Your ticket #${ticket.ticket_number} was automatically closed after ${periodHours} hours of resolution.`,
            type: "info",
            link: `/customer/tickets/${ticket._id}`,
          }).catch(() => {});
        }
      } catch {
        // Soft catch for non-socket environment
      }
    }
  }

  return { scanned: tickets.length, closed };
};
