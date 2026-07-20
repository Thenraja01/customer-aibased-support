import TicketComment from "./ticketComment.schema.js";

export const createComment = async (data) => {
  return await TicketComment.create(data);
};

export const getCommentsByTicket = async (ticketId, includeInternal = false) => {
  const filter = { ticket_id: ticketId, is_deleted: { $ne: true } };
  if (!includeInternal) {
    filter.is_internal = false;
  }
  return await TicketComment.find(filter)
    .populate("user_id", "name email role")
    .sort({ created_at: 1 });
};

export const getCommentById = async (id) => {
  const comment = await TicketComment.findOne({ _id: id, is_deleted: { $ne: true } })
    .populate("user_id", "name email role");
  if (!comment) throw new Error("Comment not found");
  return comment;
};

export const updateComment = async (id, commentText) => {
  const comment = await TicketComment.findByIdAndUpdate(
    id,
    { comment: commentText },
    { new: true, runValidators: true }
  ).populate("user_id", "name email role");
  if (!comment) throw new Error("Comment not found");
  return comment;
};

export const deleteComment = async (id) => {
  const comment = await TicketComment.findByIdAndUpdate(
    id,
    { is_deleted: true, deleted_at: new Date() },
    { new: true }
  );
  if (!comment) throw new Error("Comment not found");
  return { message: "Comment soft-deleted" };
};

export const hardDeleteComment = async (id) => {
  const comment = await TicketComment.findByIdAndDelete(id);
  if (!comment) throw new Error("Comment not found");
  return { message: "Comment permanently deleted" };
};

export const countTicketComments = async (ticketId) => {
  return await TicketComment.countDocuments({ ticket_id: ticketId, is_deleted: { $ne: true } });
};
