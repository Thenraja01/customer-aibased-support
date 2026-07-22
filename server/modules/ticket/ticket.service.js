import Ticket from "./ticket.schema.js";

export const createTicket = async (data) => {
  return await Ticket.create(data);
};

export const getAllTickets = async () => {
  return await Ticket.find()
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const getTicketById = async (id) => {
  const ticket = await Ticket.findById(id)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email");
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const getTicketsByUser = async (userId) => {
  return await Ticket.find({ user_id: userId })
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const getTicketsBySupport = async (supportId) => {
  return await Ticket.find({ assigned_to: supportId })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getTicketsByStatus = async (status) => {
  return await Ticket.find({ status })
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const assignTicket = async (id, supportId) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { assigned_to: supportId, status: "in_progress" },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const updateTicketPriority = async (id, priority) => {
  const ticket = await Ticket.findByIdAndUpdate(id, { priority }, { new: true });
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const resolveTicket = async (id) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: "resolved", resolved_at: new Date() },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const closeTicket = async (id) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: "closed" },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const deleteTicket = async (id) => {
  const ticket = await Ticket.findByIdAndDelete(id);
  if (!ticket) throw new Error("Ticket not found");
  return { message: "Ticket deleted" };
};

export const getTicketStats = async (organizationId) => {
  const query = organizationId ? { organization_id: organizationId } : {};
  const [open, inProgress, resolved, closed] = await Promise.all([
    Ticket.countDocuments({ ...query, status: "open" }),
    Ticket.countDocuments({ ...query, status: "in_progress" }),
    Ticket.countDocuments({ ...query, status: "resolved" }),
    Ticket.countDocuments({ ...query, status: "closed" }),
  ]);
  return { open, inProgress, resolved, closed, total: open + inProgress + resolved + closed };
};
