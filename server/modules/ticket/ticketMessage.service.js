import TicketMessage from "./ticketMessage.schema.js";
import Ticket from "./ticket.schema.js";

export const createMessage = async (data) => {
  const senderType = data.sender_type || "CUSTOMER";
  const message = await TicketMessage.create({
    ...data,
    sender_type: senderType,
    status: data.status || "sent",
  });

  // Update ticket chat context (last message + unread counters).
  const isCustomer = senderType === "CUSTOMER";
  await Ticket.findByIdAndUpdate(data.ticket_id, {
    last_message_at: new Date(),
    ...(isCustomer
      ? { $inc: { unread_agent_count: 1 } }
      : { $inc: { unread_customer_count: 1 } }),
  });

  return await TicketMessage.findById(message._id).populate("sender_id", "name email role");
};

export const getMessagesByTicket = async (ticketId, includeInternal = false) => {
  const filter = { ticket_id: ticketId };
  if (!includeInternal) filter.is_internal = false;
  return await TicketMessage.find(filter)
    .populate("sender_id", "name email role")
    .sort({ created_at: 1 });
};

export const getMessagesPaginated = async (ticketId, { page = 1, limit = 50, includeInternal = false } = {}) => {
  const filter = { ticket_id: ticketId };
  if (!includeInternal) filter.is_internal = false;
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    TicketMessage.find(filter)
      .populate("sender_id", "name email role")
      .sort({ created_at: 1 })
      .skip(skip)
      .limit(limit),
    TicketMessage.countDocuments(filter),
  ]);
  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
};

/**
 * Mark messages in a ticket as read for a participant. Only messages from the
 * *other* side are marked, mirroring read-receipt semantics per chat side.
 */
export const markMessagesAsRead = async (ticketId, readerId, role = null) => {
  const readerRole = (role || "").toLowerCase();
  const isStaff = ["super_admin", "admin", "branch_admin", "support"].includes(readerRole);
  const oppositeSenderType = isStaff
    ? { $in: ["CUSTOMER"] }
    : { $nin: ["CUSTOMER"] };

  const result = await TicketMessage.updateMany(
    {
      ticket_id: ticketId,
      sender_type: oppositeSenderType,
      is_internal: false,
      $or: [{ read_at: null }, { read_by: { $ne: readerId } }],
    },
    { $set: { status: "read", read_at: new Date() }, $addToSet: { read_by: readerId } }
  );

  const updateField = isStaff ? { unread_agent_count: 0 } : { unread_customer_count: 0 };
  await Ticket.findByIdAndUpdate(ticketId, updateField);

  return result;
};

export const getUnreadCountsByUser = async (userId, role) => {
  const isStaff = ["super_admin", "admin", "branch_admin", "support"].includes((role || "").toLowerCase());
  const counterField = isStaff ? "unread_agent_count" : "unread_customer_count";

  const tickets = await Ticket.find({
    [isStaff ? "assigned_to" : "user_id"]: userId,
    status: { $nin: ["closed", "cancelled"] },
  })
    .select("_id unread_agent_count unread_customer_count last_message_at")
    .lean();

  const total = tickets.reduce((sum, t) => sum + (t[counterField] || 0), 0);
  return { total, tickets };
};

export const deleteMessage = async (id) => {
  const msg = await TicketMessage.findByIdAndDelete(id);
  if (!msg) throw new Error("Message not found");
  return { message: "Message deleted" };
};