import Message from "../schema/Message.schema.js";

// Send a message in a chat
export const sendMessage = async ({ chat_id, sender_type, message }) => {
  if (!["user", "ai", "admin"].includes(sender_type)) {
    throw new Error("Invalid sender_type. Must be user, ai, or admin.");
  }
  return await Message.create({ chat_id, sender_type, message });
};

// Get all messages in a chat (oldest first)
export const getMessagesByChat = async (chatId) => {
  return await Message.find({ chat_id: chatId }).sort({ created_at: 1 });
};

// Get paginated messages for a chat
export const getPaginatedMessages = async (chatId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    Message.find({ chat_id: chatId })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    Message.countDocuments({ chat_id: chatId }),
  ]);

  return {
    messages: messages.reverse(), // return in chronological order
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

// Get the latest message in a chat
export const getLatestMessage = async (chatId) => {
  return await Message.findOne({ chat_id: chatId }).sort({ created_at: -1 });
};

// Count total messages in a chat
export const countMessages = async (chatId) => {
  return await Message.countDocuments({ chat_id: chatId });
};

// Get all AI responses in a chat
export const getAIMessages = async (chatId) => {
  return await Message.find({ chat_id: chatId, sender_type: "ai" }).sort({
    created_at: 1,
  });
};

// Delete a single message by ID
export const deleteMessage = async (messageId) => {
  const msg = await Message.findByIdAndDelete(messageId);
  if (!msg) throw new Error("Message not found");
  return { message: "Message deleted successfully" };
};

// Delete all messages in a chat (used when deleting a chat)
export const deleteMessagesByChat = async (chatId) => {
  const result = await Message.deleteMany({ chat_id: chatId });
  return { deleted: result.deletedCount };
};

// Search messages by keyword in a chat
export const searchMessages = async (chatId, keyword) => {
  return await Message.find({
    chat_id: chatId,
    message: { $regex: keyword, $options: "i" },
  }).sort({ created_at: 1 });
};