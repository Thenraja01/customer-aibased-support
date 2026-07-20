import * as ticketService from "./ticket.service.js";

export const create = async (req, res) => {
  try {
    const ticket = await ticketService.createTicket(req.body);
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const organizationId = req.organization?._id || req.user?.organization_id;
    const { page, limit, status, priority, search, userId, assignedTo, sortBy, sortOrder } = req.query;
    const result = await ticketService.getAllTickets({
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      status, priority, search, userId, assignedTo, sortBy, sortOrder,
      organizationId,
    });
    res.status(200).json({ success: true, ...(result.pagination ? result : { data: result }) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await ticketService.getTicketStats(req.query.organizationId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const ticket = await ticketService.getTicketById(req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getByUser = async (req, res) => {
  try {
    const tickets = await ticketService.getTicketsByUser(req.params.userId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByAgent = async (req, res) => {
  try {
    const tickets = await ticketService.getTicketsByAgent(req.params.agentId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getByStatus = async (req, res) => {
  try {
    const tickets = await ticketService.getTicketsByStatus(req.params.status);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const assign = async (req, res) => {
  try {
    const ticket = await ticketService.assignTicket(req.params.id, req.body.agentId);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const changePriority = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicketPriority(req.params.id, req.body.priority);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resolve = async (req, res) => {
  try {
    const ticket = await ticketService.resolveTicket(req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateStatus = async (req, res) => {
  try {
    const ticket = await ticketService.updateTicketStatus(req.params.id, req.body.status);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const escalate = async (req, res) => {
  try {
    const ticket = await ticketService.escalateTicket(req.params.id, req.body.reason);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const close = async (req, res) => {
  try {
    const ticket = await ticketService.closeTicket(req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await ticketService.deleteTicket(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
