import TicketMessage from "./ticketMessage.schema.js";

export const createMessage = async (data) => {
  return await TicketMessage.create(data);
};

export const getMessagesByTicket = async (ticketId, includeInternal = false) => {
  const filter = { ticket_id: ticketId };
  if (!includeInternal) filter.is_internal = false;
  return await TicketMessage.find(filter)
    .populate("sender_id", "name email role_id")
    .sort({ created_at: 1 });
};

export const deleteMessage = async (id) => {
  const msg = await TicketMessage.findByIdAndDelete(id);
  if (!msg) throw new Error("Message not found");
  return { message: "Message deleted" };
};
