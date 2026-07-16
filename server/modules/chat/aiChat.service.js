import * as ragService from "../rag/rag.service.js";
import * as memoryService from "../memory/memory.service.js";
import Message from "../message/message.schema.js";
import AISession from "../ai-session/aiSession.schema.js";

const GREETINGS = ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "howdy", "sup"];
const THANK_YOUS = ["thank you", "thanks", "thx", "ty", "appreciate"];
const BYES = ["bye", "goodbye", "see you", "see ya", "talk later"];

const detectIntent = (text) => {
  const lower = text.toLowerCase().trim();
  if (GREETINGS.some((g) => lower === g || lower.startsWith(g + " "))) return "greeting";
  if (THANK_YOUS.some((t) => lower.includes(t))) return "thanks";
  if (BYES.some((b) => lower.includes(b))) return "farewell";
  if (lower.includes("?")) return "question";
  return "statement";
};

const greetings = [
  "Hello! How can I assist you today?",
  "Hi there! What can I help you with?",
  "Hey! I'm your support assistant. How may I help?",
];

const farewells = [
  "Goodbye! Feel free to reach out anytime.",
  "Take care! Let me know if you need anything else.",
  "Bye! Have a great day!",
];

const thankResponses = [
  "You're welcome! Is there anything else I can help with?",
  "Happy to help! Let me know if you need anything else.",
  "My pleasure! Anything else on your mind?",
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const buildRAGContext = (ragResults) => {
  if (!ragResults || ragResults.document_results.length === 0) return "";
  const chunks = ragResults.document_results
    .filter((r) => r.score > 0.2)
    .slice(0, 3)
    .map((r) => r.content);
  return chunks.length > 0
    ? "Relevant information from knowledge base:\n" + chunks.map((c, i) => `[${i + 1}] ${c}`).join("\n\n")
    : "";
};

const buildMemoryContext = (memoryResults) => {
  if (!memoryResults || memoryResults.length === 0) return "";
  return "User context from memory:\n" + memoryResults.map((m) => `- ${m.content}`).join("\n");
};

const buildConversationContext = (recentMessages) => {
  if (!recentMessages || recentMessages.length === 0) return "";
  return recentMessages
    .map((m) => `${m.is_ai ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");
};

const generateAIResponse = (userMessage, intent, ragContext, memoryContext, convContext) => {
  if (intent === "greeting") return pick(greetings);
  if (intent === "farewell") return pick(farewells);
  if (intent === "thanks") return pick(thankResponses);

  let response = "";

  if (ragContext) {
    response = "Based on our documentation, here's what I found:\n\n";
    const lines = ragContext.split("\n").filter((l) => l.startsWith("["));
    response += lines.map((l) => l.replace(/^\[\d+\]\s*/, "")).join("\n\n");
  } else if (memoryContext) {
    response = "I remember some context about you:\n\n";
    response += memoryContext.split("\n").slice(0, 3).join("\n");
    response += "\n\nCould you tell me more about what you need help with?";
  } else {
    const lower = userMessage.toLowerCase();
    if (lower.includes("account") || lower.includes("login") || lower.includes("password")) {
      response = "I can help you with account-related issues. Could you please describe the specific problem you're facing? For example:\n\n- Forgot password\n- Account locked\n- Can't log in\n- Profile update needed";
    } else if (lower.includes("billing") || lower.includes("payment") || lower.includes("invoice")) {
      response = "I'd be happy to help with billing questions. Could you provide more details about:\n\n- Payment issue\n- Invoice request\n- Subscription change\n- Refund request";
    } else if (lower.includes("bug") || lower.includes("error") || lower.includes("issue") || lower.includes("problem") || lower.includes("not working")) {
      response = "I'm sorry to hear you're experiencing an issue. To help you better, could you share:\n\n1. What were you trying to do?\n2. What happened instead?\n3. Any error messages you saw?\n\nThis will help me or our team resolve it faster.";
    } else if (lower.includes("report") || lower.includes("ticket")) {
      response = "I can help you create a support ticket. Please describe the issue in detail and I'll guide you through the process. You can also click the 'Create Ticket' button in the header.";
    } else {
      response = "Thank you for your message. I understand you need help, but I'd like to better assist you. Could you provide more details about your question or issue?\n\nYou can also:\n- Ask about your account\n- Report a technical issue\n- Ask billing questions\n- Or click 'Create Ticket' for complex issues";
    }
  }

  return response;
};

export const processAIMessage = async ({ chatId, userId, userMessage, organizationId }) => {
  const intent = detectIntent(userMessage);

  const [ragResults, memoryResults, recentMessages] = await Promise.all([
    ragService.hybridQuery(userMessage, null, 3, userId, chatId).catch(() => null),
    memoryService.getRelevantMemories(userId, userMessage, 3).catch(() => []),
    Message.find({ chat_id: chatId }).sort({ created_at: -1 }).limit(10).lean().catch(() => []),
  ]);

  const ragContext = buildRAGContext(ragResults);
  const memoryCtx = buildMemoryContext(memoryResults);
  const convCtx = buildConversationContext(recentMessages.reverse());

  const aiResponseText = generateAIResponse(userMessage, intent, ragContext, memoryCtx, convCtx);

  const aiMessage = await Message.create({
    chat_id: chatId,
    sender_id: userId,
    content: aiResponseText,
    message_type: "text",
    is_ai: true,
  });

  await AISession.findOneAndUpdate(
    { chat_id: chatId },
    { $inc: { messages_count: 2, tokens_used: Math.ceil((userMessage.length + aiResponseText.length) / 4) } },
    { upsert: true, new: true }
  );

  return aiMessage;
};
