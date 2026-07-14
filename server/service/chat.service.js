import Chat from "../schema/Chat.schema.js";

export const createChat = async (chatData) => {
  return await Chat.create(chatData);
};


export const getAllChats = async () => {
  return await Chat.find()
    .populate("user_id")
    .sort({ created_At: -1 });
};

export const getChatById = async (chatId) => {
  return await Chat.findById(chatId).populate("user_id");
};

export const getChatsByUser = async (userId) => {
  return await Chat.find({ user_id: userId })
    .sort({ created_At: -1 });
};

export const updateChatTopic = async (chatId, topic) => {
  return await Chat.findByIdAndUpdate(
    chatId,
    { topic },
    { new: true }
  );
};

export const closeChat = async (chatId) => {
  return await Chat.findByIdAndUpdate(
    chatId,
    {
      status: "closed",
      closed_at: new Date(),
    },
    { new: true }
  );
};

export const reopenChat = async (chatId) => {
  return await Chat.findByIdAndUpdate(
    chatId,
    {
      status: "open",
      closed_at: null,
    },
    { new: true }
  );
};

export const deleteChat = async (chatId) => {
  return await Chat.findByIdAndDelete(chatId);
};


export const countUserChats = async (userId) => {
  return await Chat.countDocuments({ user_id: userId });
};


export const getActiveChats = async () => {
  return await Chat.find({ status: "open" })
    .populate("user_id")
    .sort({ created_At: -1 });
};
export const searchChats = async (keyword) => {
  return await Chat.find({
    topic: { $regex: keyword, $options: "i" },
  }).populate("user_id");
};