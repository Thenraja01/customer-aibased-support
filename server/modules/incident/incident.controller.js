import * as incidentService from "./incident.service.js";

const branchOrOrgScope = (req) => {
  const orgId = req.scope?.isSuperAdmin ? null : req.scope?.organizationId;
  const branchId = req.scope?.isSuperAdmin || req.scope?.isOrgAdmin ? null : req.scope?.branchId;
  return { orgId, branchId };
};

export const create = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const branchId = req.scope?.isOrgAdmin ? null : req.scope?.branchId;
    const incident = await incidentService.createIncident(req.body, orgId, branchId, req.user.userId);
    res.status(201).json({ success: true, data: incident });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const { orgId, branchId } = branchOrOrgScope(req);
    const status = req.query.status;
    const severity = req.query.severity;
    const filter = {};
    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    const incidents = await incidentService.getIncidents(orgId, branchId, filter);
    res.status(200).json({ success: true, data: incidents });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const { orgId, branchId } = branchOrOrgScope(req);
    const incident = await incidentService.getIncidentById(req.params.id, orgId, branchId);
    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    const status = error.message === "Incident not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { orgId, branchId } = branchOrOrgScope(req);
    const incident = await incidentService.updateIncident(
      req.params.id,
      req.body,
      orgId,
      branchId,
      req.user.userId
    );
    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    const status = error.message === "Incident not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const changeStatus = async (req, res) => {
  try {
    const { orgId, branchId } = branchOrOrgScope(req);
    const incident = await incidentService.updateIncidentStatus(
      req.params.id,
      req.body.status,
      orgId,
      branchId,
      req.user.userId,
      req.body.note
    );
    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    const status = error.message === "Incident not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const resolve = async (req, res) => {
  try {
    const { orgId, branchId } = branchOrOrgScope(req);
    const incident = await incidentService.updateIncidentStatus(
      req.params.id,
      "resolved",
      orgId,
      branchId,
      req.user.userId,
      req.body.note
    );
    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    const status = error.message === "Incident not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const linkTickets = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const incident = await incidentService.linkTickets(req.params.id, req.body.ticketIds, orgId);
    res.status(200).json({ success: true, data: incident });
  } catch (error) {
    const status = error.message === "Incident not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getLinkedTickets = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const tickets = await incidentService.getLinkedTickets(req.params.id, orgId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const notifyCustomers = async (req, res) => {
  try {
    const orgId = req.scope?.organizationId;
    const incident = await incidentService.getIncidentById(req.params.id, orgId);
    const notified = await incidentService.broadcastIncidentUpdate(incident, orgId);
    res.status(200).json({ success: true, data: { notified } });
  } catch (error) {
    const status = error.message === "Incident not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};