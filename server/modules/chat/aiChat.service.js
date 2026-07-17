import * as ragService from "../rag/rag.service.js";
import * as memoryService from "../memory/memory.service.js";
import Message from "../message/message.schema.js";
import AISession from "../ai-session/aiSession.schema.js";
import { chatCompletion, isLLMConfigured } from "../../utils/llm.utils.js";

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
    .filter((r) => r.score > 0.15)
    .slice(0, 5)
    .map((r) => ({ content: r.content, score: r.score, docId: r.document_id }));
  if (chunks.length === 0) return "";
  return "Relevant information from knowledge base:\n" +
    chunks.map((c, i) => `[${i + 1}] (relevance: ${(c.score * 100).toFixed(0)}%) ${c.content}`).join("\n\n");
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

const buildLLMMessages = (userMessage, ragContext, memoryContext, convContext) => {
  const systemPrompt = `You are a helpful AI customer support assistant for an organization. 

Your role:
- Answer questions accurately using the provided knowledge base context
- Be professional, friendly, and helpful
- If you don't have enough information, say so honestly and offer to connect them with a human agent
- Keep responses concise but thorough
- Use markdown formatting when helpful (bold, lists, etc.)
- Never make up information not found in the context

${ragContext ? `\n${ragContext}\n` : ""}
${memoryContext ? `\n${memoryContext}\n` : ""}
${convContext ? `\nPrevious conversation:\n${convContext}\n` : ""}

Guidelines:
- If context contains relevant information, base your answer on it
- If no relevant context is found, provide a helpful general response
- Always be honest about limitations
- Offer to escalate to a human agent when needed`;

  const messages = [{ role: "system", content: systemPrompt }];

  if (convContext) {
    const convLines = convContext.split("\n").filter((l) => l.trim());
    for (const line of convLines.slice(-6)) {
      if (line.startsWith("User: ")) {
        messages.push({ role: "user", content: line.replace("User: ", "") });
      } else if (line.startsWith("Assistant: ")) {
        messages.push({ role: "assistant", content: line.replace("Assistant: ", "") });
      }
    }
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
};

const generateFallbackResponse = (userMessage, ragContext, memoryContext) => {
  if (ragContext) {
    const lines = ragContext.split("\n").filter((l) => l.startsWith("["));
    if (lines.length > 0) {
      return "Based on our documentation, here's what I found:\n\n" +
        lines.map((l) => l.replace(/^\[\d+\]\s*\(relevance: \d+%\)\s*/, "")).join("\n\n");
    }
  }

  if (memoryContext) {
    return "I remember some context about you:\n\n" +
      memoryContext.split("\n").slice(0, 3).join("\n") +
      "\n\nCould you tell me more about what you need help with?";
  }

  return "Thank you for your message. I'd like to better assist you. Could you provide more details about your question or issue?\n\nYou can also:\n- Ask about your account\n- Report a technical issue\n- Ask billing questions\n- Or click 'Create Ticket' for complex issues";
};

export const processAIMessage = async ({ chatId, userId, userMessage, organizationId }) => {
  const startTime = Date.now();
  const intent = detectIntent(userMessage);

  if (intent === "greeting") {
    const responseText = pick(greetings);
    const aiMessage = await Message.create({
      chat_id: chatId,
      sender_id: userId,
      content: responseText,
      message_type: "text",
      is_ai: true,
    });

    await logAISession({
      chatId, userId, organizationId, userMessage, responseText, intent,
      ragChunksUsed: 0, kgNodesUsed: 0, responseTimeMs: Date.now() - startTime,
      modelUsed: "greeting-fallback",
    });

    return aiMessage;
  }

  if (intent === "farewell") {
    const responseText = pick(farewells);
    const aiMessage = await Message.create({
      chat_id: chatId,
      sender_id: userId,
      content: responseText,
      message_type: "text",
      is_ai: true,
    });

    await logAISession({
      chatId, userId, organizationId, userMessage, responseText, intent,
      ragChunksUsed: 0, kgNodesUsed: 0, responseTimeMs: Date.now() - startTime,
      modelUsed: "greeting-fallback",
    });

    return aiMessage;
  }

  if (intent === "thanks") {
    const responseText = pick(thankResponses);
    const aiMessage = await Message.create({
      chat_id: chatId,
      sender_id: userId,
      content: responseText,
      message_type: "text",
      is_ai: true,
    });

    await logAISession({
      chatId, userId, organizationId, userMessage, responseText, intent,
      ragChunksUsed: 0, kgNodesUsed: 0, responseTimeMs: Date.now() - startTime,
      modelUsed: "greeting-fallback",
    });

    return aiMessage;
  }

  const [ragResults, memoryResults, recentMessages] = await Promise.all([
    ragService.hybridQuery(userMessage, null, 5, userId, chatId, organizationId).catch(() => null),
    memoryService.getRelevantMemories(userId, userMessage, 3).catch(() => []),
    Message.find({ chat_id: chatId }).sort({ created_at: -1 }).limit(10).lean().catch(() => []),
  ]);

  const ragContext = buildRAGContext(ragResults);
  const memoryCtx = buildMemoryContext(memoryResults);
  const convCtx = buildConversationContext(recentMessages.reverse());

  let aiResponseText;
  let modelUsed = "fallback";
  let tokensUsed = 0;
  let ragChunksCount = ragResults?.document_results?.filter((r) => r.score > 0.15).length || 0;

  let kgNodesCount = 0;
  if (ragResults?.document_results?.length > 0) {
    try {
      const docIds = [...new Set(ragResults.document_results.map((r) => r.document_id))];
      for (const docId of docIds) {
        const nodes = await import("../knowledge-graph/knowledgeGraph.service.js")
          .then((m) => m.findNodesByDocument(docId));
        kgNodesCount += nodes.length;
      }
    } catch { /* ignore */ }
  }

  if (isLLMConfigured()) {
    try {
      const messages = buildLLMMessages(userMessage, ragContext, memoryCtx, convCtx);
      const llmResponse = await chatCompletion({
        messages,
        temperature: 0.7,
        maxTokens: 1024,
      });
      aiResponseText = llmResponse.content;
      modelUsed = llmResponse.model;
      tokensUsed = llmResponse.usage.total_tokens;
    } catch (err) {
      console.error("[AI Chat] LLM call failed, using fallback:", err.message);
      aiResponseText = generateFallbackResponse(userMessage, ragContext, memoryCtx);
      modelUsed = "fallback-error";
    }
  } else {
    aiResponseText = generateFallbackResponse(userMessage, ragContext, memoryCtx);
    modelUsed = "no-llm-configured";
  }

  const aiMessage = await Message.create({
    chat_id: chatId,
    sender_id: userId,
    content: aiResponseText,
    message_type: "text",
    is_ai: true,
  });

  const responseTimeMs = Date.now() - startTime;

  await logAISession({
    chatId, userId, organizationId, userMessage, responseText: aiResponseText,
    intent, ragChunksUsed: ragChunksCount, kgNodesUsed: kgNodesCount,
    responseTimeMs, modelUsed, tokensUsed,
  });

  await memoryService.appendToShortTerm(chatId, { role: "user", content: userMessage });
  await memoryService.appendToShortTerm(chatId, { role: "assistant", content: aiResponseText });

  return aiMessage;
};

async function logAISession({
  chatId, userId, organizationId, userMessage, responseText,
  intent, ragChunksUsed, kgNodesUsed, responseTimeMs, modelUsed, tokensUsed,
}) {
  try {
    const estimatedTokens = tokensUsed || Math.ceil((userMessage.length + responseText.length) / 4);

    await AISession.findOneAndUpdate(
      { chat_id: chatId },
      {
        $inc: { messages_count: 2, tokens_used: estimatedTokens },
        $set: {
          model: modelUsed,
          organization_id: organizationId,
        },
        $push: {
          interactions: {
            $each: [{
              query: userMessage,
              response: responseText,
              intent,
              rag_chunks_used: ragChunksUsed,
              kg_nodes_used: kgNodesUsed,
              response_time_ms: responseTimeMs,
              tokens_used: estimatedTokens,
              created_at: new Date(),
            }],
            $slice: -50,
          },
        },
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    console.error("[AI Session] Failed to log:", err.message);
  }
}
