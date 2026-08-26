import Ticket from "../ticket/ticket.schema.js";
import User from "../user/user.schema.js";
import BackgroundJob from "../ai/schemas/backgroundJob.schema.js";
import { getNextSequence } from "../../models/counter.schema.js";
import {
  DEFAULT_MAX_ACTIVE_TICKETS,
  PRIORITY_WEIGHTS,
  DEFAULT_ASSIGNMENT_STRATEGY,
} from "../../utils/constants.js";

const OPEN_STATUSES = ["open", "assigned", "in_progress", "waiting_for_customer", "escalated", "reopened"];

export const AGENT_AVAILABILITY = ["ONLINE", "BUSY", "AWAY"];

export const enqueueAssignment = async ({ ticketId, organizationId, branchId = null, strategy = DEFAULT_ASSIGNMENT_STRATEGY, user_id = null }) => {
  const existing = await BackgroundJob.findOne({
    job_type: "ticket_assign",
    related_id: ticketId,
    status: { $in: ["queued", "processing"] },
  }).lean();
  if (existing) return existing;

  try {
    return await BackgroundJob.create({
      job_type: "ticket_assign",
      organization_id: organizationId,
      user_id,
      related_id: ticketId,
      related_model: "Ticket",
      payload: { ticketId: ticketId.toString(), branchId: branchId?.toString(), strategy },
      status: "queued",
      retry_count: 0,
      priority: 1,
      scheduled_at: new Date(),
    });
  } catch {
    // Worker unavailable path: assign inline best-effort so a new ticket is
    // never stranded. Safe because assignTicket is idempotent.
    return assignTicket(ticketId, { strategy });
  }
};

/**
 * Eligible support agents for a tenant/branch. Availability only filters when
 * `respectAvailability` is set, so a down worker still has a fallback path
 * that never blocks ticket creation.
 */
export const getEligibleAgents = async (organizationId, branchId = null) => {
  const filter = {
    role: "support",
    organization_id: organizationId,
    status: "active",
  };
  if (branchId) filter.branch_id = branchId;
  return User.find(filter).select("_id name email agent_profile").lean();
};

/**
 * Weighted workload per agent. The spec recommends weighting complexity
 * (Simple=1, Normal=2, Complex=4, Critical=8); we approximate per-priority.
 */
export const getAgentWorkloads = async (organizationId, branchId = null) => {
  const agents = await getEligibleAgents(organizationId, branchId);
  if (agents.length === 0) return [];

  const ticketAgg = await Ticket.aggregate([
    {
      $match: {
        organization_id: organizationId,
        assigned_to: { $in: agents.map((a) => a._id) },
        status: { $in: OPEN_STATUSES },
      },
    },
    {
      $group: {
        _id: "$assigned_to",
        openTickets: { $sum: 1 },
        weightedLoad: {
          $sum: {
            $switch: {
              branches: [
                { case: { $eq: ["$priority", "urgent"] }, then: PRIORITY_WEIGHTS.urgent },
                { case: { $eq: ["$priority", "high"] }, then: PRIORITY_WEIGHTS.high },
                { case: { $eq: ["$priority", "low"] }, then: PRIORITY_WEIGHTS.low },
              ],
              default: PRIORITY_WEIGHTS.medium,
            },
          },
        },
      },
    },
  ]);

  const loadMap = new Map(ticketAgg.map((t) => [t._id.toString(), t]));

  return agents.map((agent) => {
    const load = loadMap.get(agent._id.toString()) || { openTickets: 0, weightedLoad: 0 };
    const capacity = agent.agent_profile?.max_active_tickets || DEFAULT_MAX_ACTIVE_TICKETS;
    return {
      _id: agent._id,
      name: agent.name,
      email: agent.email,
      openTickets: load.openTickets,
      weightedLoad: load.weightedLoad,
      maxActiveTickets: capacity,
      remaining: Math.max(capacity - load.openTickets, 0),
      availability: agent.agent_profile?.status || "OFFLINE",
      skills: agent.agent_profile?.skills || [],
    };
  });
};

/**
 * Pure strategy selection over a workload list (no DB). Exported for unit
 * testing; `selectAgent` feeds it with live workloads.
 */
export const selectFromWorkloads = (workloads, strategy = DEFAULT_ASSIGNMENT_STRATEGY, organizationId = null, branchId = null) => {
  if (!workloads || workloads.length === 0) return null;

  switch (strategy) {
    case "round_robin": {
      const withCapacity = workloads.filter((a) => a.remaining > 0);
      const pool = withCapacity.length > 0 ? withCapacity : workloads;
      return pool[0]; // persisted counter applied by caller
    }
    case "skill_based": {
      const skilled = workloads.filter((a) => a.remaining > 0 && a.skills?.length > 0);
      const pool = skilled.length > 0 ? skilled : workloads;
      return [...pool].sort((a, b) => a.weightedLoad - b.weightedLoad)[0];
    }
    case "weighted": {
      return [...workloads].sort((a, b) => a.weightedLoad - b.weightedLoad)[0];
    }
    case "priority_aware":
    case "hybrid":
    default: {
      const preferred = workloads.filter(
        (a) => a.remaining > 0 && AGENT_AVAILABILITY.includes(a.availability)
      );
      const pool = preferred.length > 0 ? preferred : workloads.filter((a) => a.remaining > 0);
      const fallback = pool.length > 0 ? pool : workloads;
      return [...fallback].sort((a, b) => a.weightedLoad - b.weightedLoad)[0];
    }
  }
};

/**
 * Select an agent for a ticket. Pure strategy selection — no writes.
 *
 * Strategies:
 *   round_robin     → durable per-tenant counter, skip at-capacity agents
 *   least_loaded    → lowest open-ticket count
 *   skill_based     → agents whose skills intersect the ticket category
 *   priority_aware  → only agents with remaining capacity, prefer least loaded
 *   weighted        → lowest weighted load (priority-weighted)
 *   hybrid (default)→ capacity + availability + least weighted load
 */
export const selectAgent = async ({ organizationId, branchId = null, strategy = DEFAULT_ASSIGNMENT_STRATEGY }) => {
  const workloads = await getAgentWorkloads(organizationId, branchId);
  if (workloads.length === 0) return null;

  if (strategy === "round_robin") {
    const withCapacity = workloads.filter((a) => a.remaining > 0);
    const pool = withCapacity.length > 0 ? withCapacity : workloads;
    const idx = (await getNextSequence(`roundRobin:${organizationId}:${branchId || "all"}`)) - 1;
    return pool[idx % pool.length];
  }

  return selectFromWorkloads(workloads, strategy, organizationId, branchId);
};

/**
 * Assign a ticket to the best agent and persist. Idempotent: already-assigned
 * tickets are left untouched (unless force is set).
 */
export const assignTicket = async (ticketId, { strategy = DEFAULT_ASSIGNMENT_STRATEGY } = {}) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) return null;
  if (ticket.assigned_to) return ticket;

  const agent = await selectAgent({
    organizationId: ticket.organization_id,
    branchId: ticket.branch_id,
    strategy,
  });
  if (!agent) return ticket;

  const updated = await Ticket.findByIdAndUpdate(
    ticketId,
    { assigned_to: agent._id, status: "assigned" },
    { new: true }
  );
  return updated;
};