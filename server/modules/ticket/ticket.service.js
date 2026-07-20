import Ticket from "./ticket.schema.js";

export const createTicket = async (data) => {
  const ticket = await Ticket.create(data);
  if (data.priority) {
    await setSlaDueDate(ticket._id, data.priority);
  }
  return await Ticket.findById(ticket._id);
};

export const getAllTickets = async (options = {}) => {
  const { page, limit, status, priority, search, userId, assignedTo, sortBy, sortOrder, organizationId } = options;
  const filter = { is_deleted: { $ne: true } };
  if (organizationId) filter.organization_id = organizationId;
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (userId) filter.user_id = userId;
  if (assignedTo) filter.assigned_to = assignedTo;
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    filter.$or = [
      { subject: { $regex: safe, $options: "i" } },
      { description: { $regex: safe, $options: "i" } },
    ];
  }

  const sortField = sortBy || "created_at";
  const sortDir = sortOrder === "asc" ? 1 : -1;
  const sortObj = {};
  sortObj[sortField] = sortDir;

  if (page && limit) {
    const total = await Ticket.countDocuments(filter);
    const tickets = await Ticket.find(filter)
      .populate("user_id", "name email")
      .populate("assigned_to", "name email")
      .sort(sortObj)
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    return {
      data: tickets,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  return await Ticket.find(filter)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort(sortObj);
};

export const getTicketById = async (id) => {
  const ticket = await Ticket.findOne({ _id: id, is_deleted: { $ne: true } })
    .populate("user_id", "name email")
    .populate("assigned_to", "name email");
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const getTicketsByUser = async (userId) => {
  return await Ticket.find({ user_id: userId, is_deleted: { $ne: true } })
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const getTicketsByAgent = async (agentId) => {
  return await Ticket.find({ assigned_to: agentId, is_deleted: { $ne: true } })
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getTicketsByStatus = async (status) => {
  return await Ticket.find({ status, is_deleted: { $ne: true } })
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const assignTicket = async (id, agentId) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { assigned_to: agentId, status: "in_progress" },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const updateTicketPriority = async (id, priority) => {
  const ticket = await Ticket.findByIdAndUpdate(id, { priority }, { new: true });
  if (!ticket) throw new Error("Ticket not found");
  await setSlaDueDate(id, priority);
  return await Ticket.findById(id);
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

export const updateTicketStatus = async (id, status) => {
  const valid = ["open", "in_progress", "resolved", "closed"];
  if (!valid.includes(status)) throw new Error("Invalid status");
  const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const escalateTicket = async (id, reason) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { priority: "urgent", $inc: { escalation_count: 1 } },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const deleteTicket = async (id) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { is_deleted: true, deleted_at: new Date() },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return { message: "Ticket soft-deleted" };
};

export const hardDeleteTicket = async (id) => {
  const ticket = await Ticket.findByIdAndDelete(id);
  if (!ticket) throw new Error("Ticket not found");
  return { message: "Ticket permanently deleted" };
};

export const getTicketStats = async (organizationId) => {
  const query = { is_deleted: { $ne: true } };
  if (organizationId) query.organization_id = organizationId;
  const [open, inProgress, resolved, closed, overdue, breached] = await Promise.all([
    Ticket.countDocuments({ ...query, status: "open" }),
    Ticket.countDocuments({ ...query, status: "in_progress" }),
    Ticket.countDocuments({ ...query, status: "resolved" }),
    Ticket.countDocuments({ ...query, status: "closed" }),
    Ticket.countDocuments({ ...query, due_date: { $lt: new Date() }, status: { $nin: ["resolved", "closed"] } }),
    Ticket.countDocuments({ ...query, sla_breached: true }),
  ]);
  return { open, inProgress, resolved, closed, overdue, slaBreached: breached, total: open + inProgress + resolved + closed };
};

export const setSlaDueDate = async (id, priority) => {
  const now = new Date();
  let slaHours = 48;
  if (priority === "urgent") slaHours = 4;
  else if (priority === "high") slaHours = 8;
  else if (priority === "medium") slaHours = 24;
  else if (priority === "low") slaHours = 72;

  const dueDate = new Date(now.getTime() + slaHours * 60 * 60 * 1000);
  const ticket = await Ticket.findByIdAndUpdate(id, { due_date: dueDate }, { new: true });
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const checkSlaBreach = async () => {
  const now = new Date();
  const result = await Ticket.updateMany(
    {
      due_date: { $lt: now },
      sla_breached: { $ne: true },
      status: { $nin: ["resolved", "closed"] },
      is_deleted: { $ne: true },
    },
    { $set: { sla_breached: true, sla_breached_at: now } }
  );
  return { modified: result.modifiedCount };
};

export const getOverdueTickets = async (organizationId) => {
  const query = {
    due_date: { $lt: new Date() },
    status: { $nin: ["resolved", "closed"] },
    is_deleted: { $ne: true },
  };
  if (organizationId) query.organization_id = organizationId;
  return await Ticket.find(query)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ due_date: 1 });
};
