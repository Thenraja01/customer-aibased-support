import {
  createTicket,
  getAllTickets,
  getTicketById,
  getTicketsByUser,
  getTicketsByAgent,
  getTicketsByStatus,
  assignTicket,
  updateTicketPriority,
  resolveTicket,
  closeTicket,
  deleteTicket,
  getTicketStats,
} from "../service/ticket.service.js";

// POST /tickets
export const create = async (req, res) => {
  try {
    const ticket = await createTicket(req.body);
    res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// GET /tickets
export const getAll = async (req, res) => {
  try {
    const tickets = await getAllTickets();
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /tickets/stats
export const getStats = async (req, res) => {
  try {
    const stats = await getTicketStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /tickets/:id
export const getById = async (req, res) => {
  try {
    const ticket = await getTicketById(req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// GET /tickets/user/:userId
export const getByUser = async (req, res) => {
  try {
    const tickets = await getTicketsByUser(req.params.userId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /tickets/agent/:agentId
export const getByAgent = async (req, res) => {
  try {
    const tickets = await getTicketsByAgent(req.params.agentId);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /tickets/status/:status
export const getByStatus = async (req, res) => {
  try {
    const tickets = await getTicketsByStatus(req.params.status);
    res.status(200).json({ success: true, data: tickets });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// PATCH /tickets/:id/assign
export const assign = async (req, res) => {
  try {
    const ticket = await assignTicket(req.params.id, req.body.agent_id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PATCH /tickets/:id/priority
export const changePriority = async (req, res) => {
  try {
    const ticket = await updateTicketPriority(req.params.id, req.body.priority);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PATCH /tickets/:id/resolve
export const resolve = async (req, res) => {
  try {
    const ticket = await resolveTicket(req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// PATCH /tickets/:id/close
export const close = async (req, res) => {
  try {
    const ticket = await closeTicket(req.params.id);
    res.status(200).json({ success: true, data: ticket });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// DELETE /tickets/:id
export const remove = async (req, res) => {
  try {
    const result = await deleteTicket(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Ticket not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
