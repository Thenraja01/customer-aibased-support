import Message from "../schema/Message.schema.js";

/**
 * Create a message
 */
export const createMessage = async (messageData) => {
  return await Message.create(messageData);
};

/**
 * Create multiple messages
 */
export const createMessages = async (messages) => {
  return await Message.insertMany(messages);
};

/**
 * Get all messages
 */
export const getAllMessages = async () => {
  return await Message.find()
    .populate({
      path: "chat_id",
      populate: {
        path: "user_id",
      },
    })
    .sort({ created_at: 1 });
};

/**
 * Get message by ID
 */
export const getMessageById = async (messageId) => {
  return await Message.findById(messageId).populate({
    path: "chat_id",
    populate: {
      path: "user_id",
    },
  });
};

/**
 * Get all messages of a chat
 */
export const getMessagesByChat = async (chatId) => {
  return await Message.find({
    chat_id: chatId,
  }).sort({ created_at: 1 });
};

/**
 * Get latest message
 */
export const getLastMessage = async (chatId) => {
  return await Message.findOne({
    chat_id: chatId,
  }).sort({ created_at: -1 });
};

/**
 * Get first message
 */
export const getFirstMessage = async (chatId) => {
  return await Message.findOne({
    chat_id: chatId,
  }).sort({ created_at: 1 });
};

/**
 * Get only user messages
 */
export const getUserMessages = async (chatId) => {
  return await Message.find({
    chat_id: chatId,
    sender_type: "user",
  }).sort({ created_at: 1 });
};

export const getAiMessages = async (chatId) => {
  return await Message.find({
    chat_id: chatId,
    sender_type: "ai",
  }).sort({ created_at: 1 });
};

export const getAdminMessages = async (chatId) => {
  return await Message.find({
    chat_id: chatId,
    sender_type: "admin",
  }).sort({ created_at: 1 });
};

export const getMessagesPaginated = async (
  chatId,
  page = 1,
  limit = 20
) => {
  const skip = (page - 1) * limit;

  return await Message.find({
    chat_id: chatId,
  })
    .sort({ created_at: 1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Count messages in a chat
 */
export const countMessages = async (chatId) => {
  return await Message.countDocuments({
    chat_id: chatId,
  });
};

/**
 * Search messages
 */
export const searchMessages = async (chatId, keyword) => {
  return await Message.find({
    chat_id: chatId,
    message: {
      $regex: keyword,
      $options: "i",
    },
  }).sort({ created_at: 1 });
};

/**
 * Update a message
 */
export const updateMessage = async (messageId, message) => {
  return await Message.findByIdAndUpdate(
    messageId,
    { message },
    { new: true }
  );
};

/**
 * Delete one message
 */
export const deleteMessage = async (messageId) => {
  return await Message.findByIdAndDelete(messageId);
};

/**
 * Delete all messages in a chat
 */
export const deleteMessagesByChat = async (chatId) => {
  return await Message.deleteMany({
    chat_id: chatId,
  });
};

/**
 * Delete all AI messages
 */
export const deleteAiMessages = async (chatId) => {
  return await Message.deleteMany({
    chat_id: chatId,
    sender_type: "ai",
  });
};

/**
 * Get chat history for AI context
 */
export const getChatHistory = async (chatId, limit = 20) => {
  return await Message.find({
    chat_id: chatId,
  })
    .sort({ created_at: -1 })
    .limit(limit);
};

/**
 * Check whether chat has messages
 */
export const hasMessages = async (chatId) => {
  const count = await Message.countDocuments({
    chat_id: chatId,
  });

  return count > 0;
};import Message from "../schema/Message.schema.js";

/**
 * Create a message
 */
export const createMessage = async (messageData) => {
  return await Message.create(messageData);
};

/**
 * Create multiple messages
 */
export const createMessages = async (messages) => {
  return await Message.insertMany(messages);
};

/**
 * Get all messages
 */
export const getAllMessages = async () => {
  return await Message.find()
    .populate({
      path: "chat_id",
      populate: {
        path: "user_id",
      },
    })
    .sort({ created_at: 1 });
};

/**
 * Get message by ID
 */
export const getMessageById = async (messageId) => {
  return await Message.findById(messageId).populate({
    path: "chat_id",
    populate: {
      path: "user_id",
    },
  });
};

/**
 * Get all messages of a chat
 */
export const getMessagesByChat = async (chatId) => {
  return await Message.find({
    chat_id: chatId,
  }).sort({ created_at: 1 });
};

/**
 * Get latest message
 */
export const getLastMessage = async (chatId) => {
  return await Message.findOne({
    chat_id: chatId,
  }).sort({ created_at: -1 });
};

/**
 * Get first message
 */
export const getFirstMessage = async (chatId) => {
  return await Message.findOne({
    chat_id: chatId,
  }).sort({ created_at: 1 });
};

/**
 * Get only user messages
 */
export const getUserMessages = async (chatId) => {
  return await Message.find({
    chat_id: chatId,
    sender_type: "user",
  }).sort({ created_at: 1 });
};

/**
 * Get only AI messages
 */
export const getAiMessages = async (chatId) => {
  return await Message.find({
    chat_id: chatId,
    sender_type: "ai",
  }).sort({ created_at: 1 });
};

/**
 * Get admin messages
 */
export const getAdminMessages = async (chatId) => {
  return await Message.find({
    chat_id: chatId,
    sender_type: "admin",
  }).sort({ created_at: 1 });
};

/**
 * Get paginated messages
 */
export const getMessagesPaginated = async (
  chatId,
  page = 1,
  limit = 20
) => {
  const skip = (page - 1) * limit;

  return await Message.find({
    chat_id: chatId,
  })
    .sort({ created_at: 1 })
    .skip(skip)
    .limit(limit);
};

/**
 * Count messages in a chat
 */
export const countMessages = async (chatId) => {
  return await Message.countDocuments({
    chat_id: chatId,
  });
};

/**
 * Search messages
 */
export const searchMessages = async (chatId, keyword) => {
  return await Message.find({
    chat_id: chatId,
    message: {
      $regex: keyword,
      $options: "i",
    },
  }).sort({ created_at: 1 });
};

/**
 * Update a message
 */
export const updateMessage = async (messageId, message) => {
  return await Message.findByIdAndUpdate(
    messageId,
    { message },
    { new: true }
  );
};

/**
 * Delete one message
 */
export const deleteMessage = async (messageId) => {
  return await Message.findByIdAndDelete(messageId);
};

/**
 * Delete all messages in a chat
 */
export const deleteMessagesByChat = async (chatId) => {
  return await Message.deleteMany({
    chat_id: chatId,
  });
};

/**
 * Delete all AI messages
 */
export const deleteAiMessages = async (chatId) => {
  return await Message.deleteMany({
    chat_id: chatId,
    sender_type: "ai",
  });
};

/**
 * Get chat history for AI context
 */
export const getChatHistory = async (chatId, limit = 20) => {
  return await Message.find({
    chat_id: chatId,
  })
    .sort({ created_at: -1 })
    .limit(limit);
};

/**
 * Check whether chat has messages
 */
export const hasMessages = async (chatId) => {
  const count = await Message.countDocuments({
    chat_id: chatId,
  });

  return count > 0;
};