import Ticket from "../modules/ticket/ticket.schema.js";
import Message from "../modules/message/message.schema.js";
import Chat from "../modules/chat/chat.schema.js";
import { chatCompletion, isLLMConfigured } from "../utils/llm.utils.js";

export const handleTicketCreate = async (socket, data) => {
  const { subject, description, priority, chatId } = data;
  if (!subject || !description) throw new Error("subject and description are required");

  const ticketData = {
    user_id: socket.user._id,
    organization_id: socket.user.organization_id,
    subject,
    description,
    priority: priority || "medium",
  };
  if (chatId) ticketData.chat_id = chatId;

  const ticket = await Ticket.create(ticketData);

  if (chatId) {
    await Chat.findByIdAndUpdate(chatId, { status: "escalated" });
  }

  return ticket;
};

export const handleTicketCreateFromChat = async (socket, data) => {
  const { chatId, message } = data;
  if (!chatId) throw new Error("chatId is required");

  const chat = await Chat.findOne({ _id: chatId, is_deleted: { $ne: true } });
  if (!chat) throw new Error("Chat not found");

  const recentMessages = await Message.find({ chat_id: chatId })
    .sort({ created_at: -1 })
    .limit(10)
    .lean();

  const conversation = recentMessages
    .reverse()
    .map((m) => `${m.is_ai ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");

  if (isLLMConfigured()) {
    try {
      const prompt = `Extract ticket details from the following conversation. Return ONLY valid JSON with no markdown formatting or code blocks:

{
  "subject": "short summary (max 255 chars)",
  "description": "detailed description of the issue (max 5000 chars)",
  "priority": "low|medium|high|urgent"
}

Conversation:
${conversation}

${message ? `\nUser's request: ${message}` : ""}

JSON:`;

      const response = await chatCompletion({
        messages: [
          { role: "system", content: "You extract structured ticket data from conversations. Return only valid JSON." },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        maxTokens: 1024,
      });

      const cleanJson = response.content.replace(/```json\s*|```\s*/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      const ticket = await Ticket.create({
        user_id: socket.user._id,
        organization_id: chat.organization_id,
        subject: parsed.subject || "Issue from chat",
        description: parsed.description || message || "No description provided",
        priority: ["low", "medium", "high", "urgent"].includes(parsed.priority) ? parsed.priority : "medium",
        chat_id: chatId,
      });

      await Chat.findByIdAndUpdate(chatId, { status: "escalated" });

      return ticket;
    } catch (err) {
      const ticket = await Ticket.create({
        user_id: socket.user._id,
        organization_id: chat.organization_id,
        subject: message ? message.split(".")[0].substring(0, 255) : "Issue from chat",
        description: message || "No description provided",
        priority: "medium",
        chat_id: chatId,
      });

      await Chat.findByIdAndUpdate(chatId, { status: "escalated" });

      return ticket;
    }
  }

  const ticket = await Ticket.create({
    user_id: socket.user._id,
    organization_id: chat.organization_id,
    subject: message ? message.substring(0, 255) : "Issue from chat",
    description: message || "No description provided",
    priority: "medium",
    chat_id: chatId,
  });

  await Chat.findByIdAndUpdate(chatId, { status: "escalated" });

  return ticket;
};
