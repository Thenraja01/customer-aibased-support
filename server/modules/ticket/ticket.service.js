import Ticket from "./ticket.schema.js";
import User from "../user/user.schema.js";
import Role from "../role/role.schema.js";
import Chat from "../chat/chat.schema.js";
import Message from "../message/message.schema.js";

export const createTicket = async (data) => {
  return await Ticket.create(data);
};

export const escalateFromChat = async ({ chatId, subject, description, userId, organizationId }) => {
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

  const ticket = await Ticket.create({
    user_id: userId,
    organization_id: organizationId,
    subject: subject || `Escalated from chat: ${chat.topic || "Support Chat"}`,
    description: description || "Customer requested escalation from AI chat.",
    category: "question",
    status: "open",
    priority: "medium",
    escalated_from_chat: {
      chat_id: chatId,
      conversation_preview: conversationPreview.substring(0, 2000),
    },
  });

  return ticket;
};

export const getAllTickets = async (organizationId = null) => {
  const filter = {};
  if (organizationId) filter.organization_id = organizationId;
  return await Ticket.find(filter)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const getTicketById = async (id) => {
  const ticket = await Ticket.findById(id)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .populate("resolved_by", "name email")
    .populate("closed_by", "name email");
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const getTicketsByUser = async (userId, organizationId = null) => {
  const filter = { user_id: userId };
  if (organizationId) filter.organization_id = organizationId;
  return await Ticket.find(filter)
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const getTicketsBySupport = async (supportId, organizationId = null) => {
  const filter = { assigned_to: supportId };
  if (organizationId) filter.organization_id = organizationId;
  return await Ticket.find(filter)
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const getTicketsByStatus = async (status, organizationId = null) => {
  const filter = { status };
  if (organizationId) filter.organization_id = organizationId;
  return await Ticket.find(filter)
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .sort({ created_at: -1 });
};

export const assignTicket = async (id, supportId) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { assigned_to: supportId, status: "assigned" },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const setTicketPending = async (id) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: "pending" },
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

export const resolveTicket = async (id, userId) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: "resolved", resolved_by: userId, resolved_at: new Date() },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const closeTicket = async (id, userId) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: "closed", closed_by: userId, closed_at: new Date() },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const reopenTicket = async (id) => {
  const ticket = await Ticket.findByIdAndUpdate(
    id,
    { status: "open", closed_by: null, closed_at: null },
    { new: true }
  );
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const updateTicketStatus = async (id, status) => {
  const ticket = await Ticket.findByIdAndUpdate(id, { status }, { new: true });
  if (!ticket) throw new Error("Ticket not found");
  return ticket;
};

export const deleteTicket = async (id) => {
  const ticket = await Ticket.findByIdAndDelete(id);
  if (!ticket) throw new Error("Ticket not found");
  return { message: "Ticket deleted" };
};

export const getQueue = async (organizationId) => {
  const priorityOrder = { critical: 1, high: 2, medium: 3, low: 4 };
  const tickets = await Ticket.find({
    organization_id: organizationId,
    status: { $in: ["open", "assigned", "pending"] },
  })
    .populate("user_id", "name email")
    .populate("assigned_to", "name email")
    .lean();

  tickets.sort((a, b) => {
    const pa = priorityOrder[a.priority] || 99;
    const pb = priorityOrder[b.priority] || 99;
    if (pa !== pb) return pa - pb;
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
  });

  return tickets;
};

export const getSupportUserIds = async (organizationId) => {
  const supportRole = await Role.findOne({ role_name: /support/i });
  if (!supportRole) return [];
  const agents = await User.find({ role_id: supportRole._id, organization_id: organizationId }).select("_id");
  return agents.map((a) => a._id);
};

export const getAgentWorkload = async (organizationId) => {
  const supportRole = await Role.findOne({ role_name: /support/i });
  if (!supportRole) return [];

  const agents = await User.find({ role_id: supportRole._id, organization_id: organizationId }).select("_id name email");
  const workload = await Promise.all(
    agents.map(async (agent) => {
      const openCount = await Ticket.countDocuments({
        assigned_to: agent._id,
    status: { $in: ["open", "assigned", "in_progress", "waiting_for_customer", "pending"] },
      });
      return { _id: agent._id, name: agent.name, email: agent.email, openTickets: openCount };
    })
  );
  return workload.sort((a, b) => a.openTickets - b.openTickets);
};

export const smartAssign = async (ticketId, organizationId) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) throw new Error("Ticket not found");

  const workload = await getAgentWorkload(organizationId);
  if (workload.length === 0) throw new Error("No support agents available");

  const leastBusy = workload[0];
  const updated = await Ticket.findByIdAndUpdate(
    ticketId,
    { assigned_to: leastBusy._id, status: "assigned" },
    { new: true }
  ).populate("assigned_to", "name email");

  return { ticket: updated, assignedTo: leastBusy };
};

export const getTicketStats = async (organizationId = null) => {
  const query = organizationId ? { organization_id: organizationId } : {};
  const [open, assigned, inProgress, waitingForCustomer, pending, resolved, closed] = await Promise.all([
    Ticket.countDocuments({ ...query, status: "open" }),
    Ticket.countDocuments({ ...query, status: "assigned" }),
    Ticket.countDocuments({ ...query, status: "in_progress" }),
    Ticket.countDocuments({ ...query, status: "waiting_for_customer" }),
    Ticket.countDocuments({ ...query, status: "pending" }),
    Ticket.countDocuments({ ...query, status: "resolved" }),
    Ticket.countDocuments({ ...query, status: "closed" }),
  ]);
  return {
    open, assigned, in_progress: inProgress, waiting_for_customer: waitingForCustomer, pending, resolved, closed,
    total: open + assigned + inProgress + waitingForCustomer + pending + resolved + closed,
  };
};
