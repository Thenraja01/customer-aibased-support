import Chat from "../schema/Chat.schema.js";

export const createChat = async (chatData) => {
  try {
    const chat = await Chat.create(chatData);
    return await chat.populate("user_id");
  } catch (error) {
    throw error;
  }
};

export const deleteChat = async (chatId) => {
  try {
    const deletedChat = await Chat.findByIdAndDelete(chatId);

    if (!deletedChat) {
      throw new Error("Chat not found");
    }

    return deletedChat;
  } catch (error) {
    throw error;
  }
};

export const getAllChat = async () => {
  try {
    return await Chat.find().populate("user_id");
  } catch (error) {
    throw error;
  }
};