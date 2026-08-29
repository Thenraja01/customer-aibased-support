import Ticket from "./ticket.schema.js";
import User from "../user/user.schema.js";
import Chat from "../chat/chat.schema.js";
import Message from "../message/message.schema.js";
import { getNextSequence } from "../../models/counter.schema.js";
import {
  TICKET_TRANSITIONS,
  DEFAULT_ASSIGNMENT_STRATEGY,
} from "../../utils/constants.js";
import {
  applySlaDeadlines,
  decorateTicketSla,
  getSlaTargets,
  recalculateSlaForPriority,
} from "./sla.service.js";
import { enqueueAssignment, getAgentWorkloads } from "../assignment/assignment.service.js";
import { sendLifecycleEmail } from "../../services/emailTemplate.service.js";

// After this window a resolved/closed ticket cannot be reopened; a new linked
// ticket must be created instead.
export const REOPEN_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const generateTicketNumber = async (organizationId) => {
  const seq = await getNextSequence(`ticket:${organizationId}`);
  return `${String(seq).padStart(5, "0")}`;
};

export const canTransition = (from, to) => {
  if (!to || to === from) return true;
  const allowed = TICKET_TRANSITIONS[from];
  return Array.isArray(allowed) && allowed.includes(to);
};

/**
 * Create a ticket. Deliberately lightweight: persist + publish + return.
 * Assignment, SLA scheduling, and notifications happen via the job queue so a
 * 10,000-ticket burst never blocks the API.
 */
export const createTicket = async (data, organizationId, branchId = null) => {
  const slaEnriched = await applySlaDeadlines({
    ...data,
    organization_id: organizationId || data.organization_id,
    branch_id: data.branch_id || branchId,
  });

  const ticket = await Ticket.create({
    ...slaEnriched,
    ticket_number: await generateTicketNumber(organizationId || data.organization_id),
    status: data.status || "open",
  });

  // Queue auto-assignment (durable, idempotent). Never awaited to keep the
  // request path light — the worker assigns and notifies.
  enqueueAssignment({
    ticketId: ticket._id,
    organizationId: ticket.organization_id,
    branchId: ticket.branch_id,
    strategy: DEFAULT_ASSIGNMENT_STRATEGY,
  }).catch((err) => console.error("[Ticket] Assignment enqueue failed:", err.message));

  // Asynchronously dispatch ticket_created email to customer
  if (ticket.user_id) {
    User.findById(ticket.user_id)
      .select("name email")
      .lean()
      .then((customer) => {
        if (customer?.email) {
          sendLifecycleEmail({
            templateKey: "ticket_created",
            recipientEmail: customer.email,
            data: {
              customer_name: customer.name || "Customer",
              ticket_id: ticket.ticket_number || ticket._id,
              subject: ticket.subject,
              priority: ticket.priority,
            },
            organizationId: ticket.organization_id,
            branchId: ticket.branch_id,
          }).catch((err) => console.error("[LifecycleEmail] ticket_created failed:", err.message));
        }
      })
      .catch(() => {});
  }

  return ticket;
};

export const escalateFromChat = async ({ chatId, subject, description, userId, organizationId, branchId }) => {
  const chat = await Chat.findById(chatId);
  if (!chat) throw new Error("Chat not found");

  const messages = await Message.find({ chat_id: chatId })
    .sort({ created_at: -1 })
    .limit(10)
    .lean();

  const conversationPreview = messages
    .reverse()
    .map((m) => `${m.is_ai ? "AI" : "User"}: ${(m.content || "").substring(0, 200)}`)
    .join("\n\n");

  const ticket = await createTicket(
    {
      user_id: userId,
      organization_id: organizationId,
      branch_id: branchId,
      subject: subject || `Escalated from chat: ${chat.topic || "Support Chat"}`,
      description: description || "Customer requested escalation from AI chat.",
      category: "question",
      status: "open",
      priority: "medium",
      source: "chat",
      escalated_from_chat: {
        chat_id: chatId,
        conversation_preview: conversationPreview.substring(0, 2000),
      },
    },
    organizationId,
    branchId
  );

  return ticket;
};

export const getAllTickets = async (organizationId = null, branchId = null) => {
  const filter = {};
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) filter.branch_id = branchId;
  const targets = await getSlaTargets(organizationId);
  const tickets = await Ticket.find(filter)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 })
    .lean();
  return tickets.map((t) => decorateTicketSla(t, targets));
};

export const getTickets = async (query = {}, organizationId = null, branchId = null) => {
  const filter = { ...query };
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) filter.branch_id = branchId;
  const targets = await getSlaTargets(organizationId);
  const tickets = await Ticket.find(filter)
    .populate("user_id", "name email role")
    .populate("assigned_to", "name email role")
    .populate("previously_assigned_to", "name email role")
    .sort({ created_at: -1 })
    .lean();
  return tickets.map((t) => decorateTicketSla(t, targets));
};

export const getTicketById = async (id, organizationId = null, branchId = null) => {
  const filter = { _id: id };
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) filter.branch_id = branchId;
  const ticket = await Ticket.findOne(filter)
    .populate("user_id", "name email role")
    .populate("assigned_to", "name email role")
    .populate("previously_assigned_to", "name email role")
    .populate("escalation.escalated_by", "name email role")
    .populate("reassignment_history.from_user", "name email role")
    .populate("reassignment_history.to_user", "name email role")
    .populate("reassignment_history.assigned_by", "name email role")
    .populate("branch_id", "name code")
    .populate("organization_id", "name")
    .populate("resolved_by", "name email")
    .populate("closed_by", "name email");
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const getTicketByNumber = async (ticketNumber, organizationId = null) => {
  const filter = { ticket_number: ticketNumber };
  if (organizationId) filter.organization_id = organizationId;
  const ticket = await Ticket.findOne(filter)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email");
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const getTicketsByUser = async (userId, organizationId = null, branchId = null) => {
  const filter = { user_id: userId };
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) filter.branch_id = branchId;
  return await Ticket.find(filter)
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const getTicketsBySupport = async (supportId, organizationId = null, branchId = null) => {
  const filter = { assigned_to: supportId };
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) filter.branch_id = branchId;
  return await Ticket.find(filter)
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getTicketsByStatus = async (status, organizationId = null, branchId = null) => {
  const filter = { status };
  if (organizationId) filter.organization_id = organizationId;
  if (branchId) filter.branch_id = branchId;
  return await Ticket.find(filter)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const assignTicket = async (id, supportId, assignedBy = null, note = null) => {
  const existing = await Ticket.findById(id);
  if (!existing) throw new Error("Ticket not found");

  const prevAssigned = existing.assigned_to;
  const historyEntry = {
    from_user: prevAssigned,
    to_user: supportId,
    assigned_by: assignedBy || supportId,
    assigned_at: new Date(),
    note: note || null,
  };

  const ticket = await Ticket.findByIdAndUpdate(
    id,
    {
      assigned_to: supportId,
      previously_assigned_to: prevAssigned && prevAssigned.toString() !== supportId.toString() ? prevAssigned : existing.previously_assigned_to,
      status: existing.status === "open" || existing.status === "escalated" || existing.status === "new" ? "assigned" : existing.status,
      $push: { reassignment_history: historyEntry },
    },
    { new: true }
  )
    .populate("user_id", "name email role")
    .populate("assigned_to", "name email role")
    .populate("previously_assigned_to", "name email role");

  // Asynchronously dispatch ticket_assigned email to assigned agent
  if (ticket?.assigned_to?.email) {
    sendLifecycleEmail({
      templateKey: "ticket_assigned",
      recipientEmail: ticket.assigned_to.email,
      data: {
        agent_name: ticket.assigned_to.name || "Support Agent",
        customer_name: ticket.user_id?.name || "Customer",
        ticket_id: ticket.ticket_number || ticket._id,
        subject: ticket.subject,
        priority: ticket.priority,
      },
      organizationId: ticket.organization_id,
      branchId: ticket.branch_id,
    }).catch((err) => console.error("[LifecycleEmail] ticket_assigned failed:", err.message));
  }

  return ticket;
};

export const takeoverTicket = async (id, adminUserId, note = "Branch Admin Takeover") => {
  const existing = await Ticket.findById(id);
  if (!existing) throw new Error("Ticket not found");

  const prevAssigned = existing.assigned_to;
  const historyEntry = {
    from_user: prevAssigned,
    to_user: adminUserId,
    assigned_by: adminUserId,
    assigned_at: new Date(),
    note,
  };

  const ticket = await Ticket.findByIdAndUpdate(
    id,
    {
      assigned_to: adminUserId,
      previously_assigned_to: prevAssigned && prevAssigned.toString() !== adminUserId.toString() ? prevAssigned : existing.previously_assigned_to,
      status: "in_progress",
      $push: { reassignment_history: historyEntry },
    },
    { new: true }
  )
    .populate("user_id", "name email role")
    .populate("assigned_to", "name email role")
    .populate("previously_assigned_to", "name email role");

  return ticket;
};

export const setTicketPending = async (id) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: "waiting_for_customer" },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const updateTicketPriority = async (id, priority) => {
  const existing = await Ticket.findById(id);
  if (!existing) throw new Error("Ticket not found");
  return recalculateSlaForPriority(id, priority, existing.organization_id);
};

export const resolveTicket = async (id, userId) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: "resolved", resolved_by: userId, resolved_at: new Date() },
    { new: true }
  ).populate("user_id", "name email");
  if (!ticket) throw new Error("Ticket not found");

  // Asynchronously dispatch ticket_resolved email to customer
  if (ticket.user_id?.email) {
    sendLifecycleEmail({
      templateKey: "ticket_resolved",
      recipientEmail: ticket.user_id.email,
      data: {
        customer_name: ticket.user_id.name || "Customer",
        ticket_id: ticket.ticket_number || ticket._id,
        subject: ticket.subject,
        priority: ticket.priority,
      },
      organizationId: ticket.organization_id,
      branchId: ticket.branch_id,
    }).catch((err) => console.error("[LifecycleEmail] ticket_resolved failed:", err.message));
  }

  return ticket;
};

export const closeTicket = async (id, userId, reason = null) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: "closed", closed_by: userId, closed_at: new Date(), close_reason: reason },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

/**
 * Reopen a resolved/closed ticket. Within the reopen window the same ticket
 * is restored; outside the window a new linked ticket must be created.
 * Returns { action, ticket } where action is "reopened" or "requires_new".
 */
export const reopenTicket = async (id) => {
  const ticket = await Ticket.findById(id);
  if (!ticket) throw new Error("Ticket not found");

  if (ticket.status !== "resolved" && ticket.status !== "closed") {
    throw new Error("Only resolved or closed tickets can be reopened");
  }

  const closedAt = ticket.closed_at || ticket.resolved_at || ticket.updated_at || new Date();
  const withinWindow = Date.now() - new Date(closedAt).getTime() <= REOPEN_WINDOW_MS;

  if (!withinWindow) {
    return { action: "requires_new", ticket };
  }

  const updated = await Ticket.findByIdAndUpdate(
    id,
    {
      status: "reopened",
      reopened_at: new Date(),
      $inc: { reopen_count: 1 },
      closed_by: null,
      closed_at: null,
      close_reason: null,
    },
    { new: true }
  );
  return { action: "reopened", ticket: updated };
};

export const escalateTicket = async (id, { escalatedBy, reason = null, target = "support" }) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    {
      status: "escalated",
      escalation: {
        escalated_by: escalatedBy,
        escalated_at: new Date(),
        reason: reason?.substring(0, 2000) || null,
        target,
      },
    },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const cancelTicket = async (id, userId, reason = null) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    {
      status: "cancelled",
      cancelled_by: userId,
      cancelled_at: new Date(),
      cancel_reason: reason?.substring(0, 500) || null,
    },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const updateTicketStatus = async (id, status, userId = null) => {
  const existing = await Ticket.findById(id);
  if (!existing) throw new Error("Ticket not found");
  if (!canTransition(existing.status, status)) {
    throw new Error(`Cannot transition ticket from ${existing.status} to ${status}`);
  }
  const patch = { status };
  if (status === "resolved" && !existing.resolved_at) {
    patch.resolved_at = new Date();
    if (userId) patch.resolved_by = userId;
  }
  if (status === "closed" && !existing.closed_at) {
    patch.closed_at = new Date();
    if (userId) patch.closed_by = userId;
  }
  const ticket = await Ticket.findByIdAndUpdate(id, patch, { new: true });
  return ticket;
};

export const deleteTicket = async (id) => {
  const ticket = await Ticket.findByIdAndDelete(id);
  if (!ticket) throw new Error("Ticket not found");
  return { message: "Ticket deleted" };
};

export const getQueue = async (organizationId, branchId = null) => {
  const priorityOrder = { urgent: 1, high: 2, medium: 3, low: 4 };
  const filter = {
    organization_id: organizationId,
    status: { $in: ["open", "assigned", "in_progress", "waiting_for_customer", "escalated", "reopened"] },
  };
  if (branchId) filter.branch_id = branchId;

  const targets = await getSlaTargets(organizationId);
  const tickets = await Ticket.find(filter)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .lean();

  const decorated = tickets.map((t) => decorateTicketSla(t, targets));

  decorated.sort((a, b) => {
    if (a.sla_status === "breached" && b.sla_status !== "breached") return -1;
    if (b.sla_status === "breached" && a.sla_status !== "breached") return 1;
    if (a.sla_status === "warning" && b.sla_status === "on_track") return -1;
    if (b.sla_status === "warning" && a.sla_status === "on_track") return 1;
    const pa = priorityOrder[a.priority] || 99;
    const pb = priorityOrder[b.priority] || 99;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return decorated;
};

export const getSupportUserIds = async (organizationId, branchId = null) => {
  const filter = { role: "support", organization_id: organizationId, status: "active" };
  if (branchId) filter.branch_id = branchId;
  const agents = await User.find(filter).select("_id");
  return agents.map((a) => a._id);
};

export const getAgentWorkload = async (organizationId, branchId = null) => {
  const workloads = await getAgentWorkloads(organizationId, branchId);
  return workloads.map((w) => ({
    _id: w._id,
    name: w.name,
    email: w.email,
    openTickets: w.openTickets,
    weightedLoad: w.weightedLoad,
    maxActiveTickets: w.maxActiveTickets,
    remaining: w.remaining,
    availability: w.availability,
  }));
};

export const smartAssign = async (ticketId, organizationId) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");
  if (ticket.assigned_to) {
    return { ticket, assignedTo: null, alreadyAssigned: true };
  }

  const workloads = await getAgentWorkloads(organizationId, ticket.branch_id);
  if (workloads.length === 0) throw new Error("No support agents available");

  const leastBusy = [...workloads].sort((a, b) => a.weightedLoad - b.weightedLoad)[0];
  const updated = await Ticket.findByIdAndUpdate(
    ticketId,
    { assigned_to: leastBusy._id, status: "assigned" },
    { new: true }
  ).populate("assigned_to", "name email");

  return { ticket: updated, assignedTo: leastBusy };
};

export const getTicketStats = async (organizationId = null, branchId = null, userId = null) => {
  const query = {};
  if (organizationId) query.organization_id = organizationId;
  if (branchId) query.branch_id = branchId;

  const assignedToMeCount = userId ? await Ticket.countDocuments({ ...query, assigned_to: userId, status: { $ne: "closed" } }) : 0;

  const [open, assigned, inProgress, waitingForCustomer, escalated, resolved, closed, reopened, cancelled] =
    await Promise.all([
      Ticket.countDocuments({ ...query, status: "open" }),
      Ticket.countDocuments({ ...query, status: "assigned" }),
      Ticket.countDocuments({ ...query, status: "in_progress" }),
      Ticket.countDocuments({ ...query, status: "waiting_for_customer" }),
      Ticket.countDocuments({ ...query, status: "escalated" }),
      Ticket.countDocuments({ ...query, status: "resolved" }),
      Ticket.countDocuments({ ...query, status: "closed" }),
      Ticket.countDocuments({ ...query, status: "reopened" }),
      Ticket.countDocuments({ ...query, status: "cancelled" }),
    ]);
  const openCount = open + assigned + inProgress + waitingForCustomer + escalated + reopened;
  return {
    assignedToMe: assignedToMeCount,
    openTickets: openCount,
    inProgressTickets: inProgress,
    resolvedTickets: resolved,
    open: openCount,
    assigned,
    in_progress: inProgress,
    waiting_for_customer: waitingForCustomer,
    escalated,
    reopened,
    cancelled,
    resolved,
    closed,
    total: openCount + resolved + closed + cancelled,
  };
};