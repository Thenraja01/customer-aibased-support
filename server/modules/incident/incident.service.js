import Incident from "./incident.schema.js";
import Ticket from "../ticket/ticket.schema.js";
import * as notifService from "../notification/notification.service.js";
import { enqueueJob } from "../ai/ai.service.js";

const OPEN_INCIDENT_STATUSES = ["detected", "investigating", "identified", "mitigating"];

export const createIncident = async (data, organizationId, branchId, userId) => {
  const incident = await Incident.create({
    ...data,
    organization_id: organizationId,
    branch_id: data.branch_id || branchId,
    created_by: userId,
    owner: data.owner || userId,
    affected_ticket_count: 0,
  });
  return incident;
};

export const getIncidents = async (organizationId = null, branchId = null, filter = {}) => {
  const query = { ...filter };
  if (organizationId) query.organization_id = organizationId;
  if (branchId) query.branch_id = branchId;
  return Incident.find(query)
    .populate("owner", "name email")
    .populate("created_by", "name email")
    .sort({ created_at: -1 });
};

export const getIncidentById = async (id, organizationId = null, branchId = null) => {
  const query = { _id: id };
  if (organizationId) query.organization_id = organizationId;
  if (branchId) query.branch_id = branchId;
  const incident = await Incident.findOne(query)
    .populate("owner", "name email")
    .populate("created_by", "name email");
  if (!incident) throw new Error("Incident not found");
  return incident;
};

export const updateIncident = async (id, data, organizationId, branchId = null, userId = null) => {
  const query = { _id: id };
  if (organizationId) query.organization_id = organizationId;
  if (branchId) query.branch_id = branchId;

  const allowed = {};
  ["title", "description", "severity", "affected_service", "owner", "status"].forEach((k) => {
    if (data[k] !== undefined) allowed[k] = data[k];
  });

  const pushTimeline = [];
  if (data.status && data.status !== undefined) {
    pushTimeline.push({ status: data.status, note: data.status_note || null, changed_by: userId });
  } else if (data.note) {
    pushTimeline.push({ status: null, note: data.note, changed_by: userId });
  }

  const incident = await Incident.findOneAndUpdate(
    query,
    {
      $set: allowed,
      ...(pushTimeline.length ? { $push: { timeline: { $each: pushTimeline } } } : {}),
    },
    { new: true }
  );
  if (!incident) throw new Error("Incident not found");
  return incident;
};

export const updateIncidentStatus = async (id, status, organizationId, branchId = null, userId = null, note = null) => {
  const incident = await Incident.findOneAndUpdate(
    { _id: id, ...(organizationId ? { organization_id: organizationId } : {}), ...(branchId ? { branch_id: branchId } : {}) },
    {
      $set: {
        status,
        ...(status === "resolved" ? { resolved_at: new Date(), resolved_by: userId } : {}),
        ...(status === "closed" ? { closed_at: new Date() } : {}),
      },
      $push: { timeline: { status, note, changed_by: userId } },
    },
    { new: true }
  );
  if (!incident) throw new Error("Incident not found");
  return incident;
};

/**
 * Link tickets to an incident. Bulk-updates the incident_id on each ticket and
 * refreshes the incident's affected_ticket_count.
 */
export const linkTickets = async (incidentId, ticketIds, organizationId) => {
  const incident = await Incident.findOne({ _id: incidentId, organization_id: organizationId });
  if (!incident) throw new Error("Incident not found");

  const ids = Array.isArray(ticketIds) ? ticketIds : [ticketIds];
  const validIds = ids.filter(Boolean);

  await Ticket.updateMany(
    { _id: { $in: validIds }, organization_id: organizationId },
    { $set: { incident_id: incidentId, status: "in_progress" } }
  );

  const count = await Ticket.countDocuments({ incident_id: incidentId, organization_id: organizationId });
  await Incident.findByIdAndUpdate(incidentId, { affected_ticket_count: count });
  incident.affected_ticket_count = count;

  return incident;
};

export const getLinkedTickets = async (incidentId, organizationId) => {
  return Ticket.find({ incident_id: incidentId, organization_id: organizationId })
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

/**
 * Bulk customer communication: notify every customer with a ticket linked to
 * the incident. Asynchronous — enqueued as a job so it never blocks the API.
 */
export const broadcastIncidentUpdate = async (incident, organizationId) => {
  const tickets = await Ticket.find({ incident_id: incident._id, organization_id: organizationId })
    .select("user_id")
    .lean();
  const customerIds = [...new Set(tickets.map((t) => t.user_id?.toString()).filter(Boolean))];

  await enqueueJob({
    job_type: "incident_notify",
    organization_id: organizationId,
    related_id: incident._id,
    related_model: "Incident",
    payload: {
      incidentId: incident._id.toString(),
      customerIds,
      title: `Incident update: ${incident.title}`,
      message: incident.description?.substring(0, 200) || "We are working on an ongoing incident.",
      link: "/tickets",
    },
  });

  return customerIds.length;
};

export const processIncidentNotification = async (job) => {
  const { incidentId, customerIds, title, message, link } = job.payload || {};
  if (!customerIds?.length) return { notified: 0 };
  const created = await notifService.broadcastNotification(
    { title, message, type: "warning", link, organization_id: job.organization_id },
    customerIds
  );
  return { notified: created?.length || 0 };
};