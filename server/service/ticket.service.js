import Ticket from "../schema/Ticket.schema.js";

// Create a support ticket from a chat
export const createTicket = async ({ chat_id, user_id, priority = "medium" }) => {
  return await Ticket.create({ chat_id, user_id, priority, status: "open" });
};

// Get all tickets (admin)
export const getAllTickets = async () => {
  return await Ticket.find()
    .populate("chat_id", "topic status")
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

// Get a ticket by ID
export const getTicketById = async (ticketId) => {
  const ticket = await Ticket.findById(ticketId)
    .populate("chat_id", "topic status")
    .populate("user_id", "name email")
    .populate("assigned_to", "name email");

  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

// Get all tickets for a specific user
export const getTicketsByUser = async (userId) => {
  return await Ticket.find({ user_id: userId })
    .populate("chat_id", "topic status")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

// Get tickets assigned to an agent
export const getTicketsByAgent = async (agentId) => {
  return await Ticket.find({ assigned_to: agentId })
    .populate("chat_id", "topic status")
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

// Get tickets by status
export const getTicketsByStatus = async (status) => {
  const allowed = ["open", "in_progress", "resolved", "closed"];
  if (!allowed.includes(status)) throw new Error("Invalid ticket status");

  return await Ticket.find({ status })
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

// Assign ticket to an agent
export const assignTicket = async (ticketId, agentId) => {
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { assigned_to: agentId, status: "in_progress" },
    { new: true }
  )
    .populate("user_id", "name email")
    .populate("assigned_to", "name email");

  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

// Update ticket priority
export const updateTicketPriority = async (ticketId, priority) => {
  const allowed = ["low", "medium", "high", "urgent"];
  if (!allowed.includes(priority)) throw new Error("Invalid priority value");

  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { priority },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

// Resolve a ticket
export const resolveTicket = async (ticketId) => {
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { status: "resolved", resolved_at: new Date() },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

// Close a ticket
export const closeTicket = async (ticketId) => {
  const ticket = await Ticket.findByIdAndUpdate(
    ticketId,
    { status: "closed" },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

// Delete a ticket
export const deleteTicket = async (ticketId) => {
  const ticket = await Ticket.findByIdAndDelete(ticketId);
  if (!ticket) throw new Error("Ticket not found");
  return { message: "Ticket deleted successfully" };
};

// Count tickets by status for dashboard stats
export const getTicketStats = async () => {
  const stats = await Ticket.aggregate([
    { $group: { _id: "$status", count: { $sum: 1 } } },
  ]);
  return stats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {});
};
