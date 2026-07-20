import Message from "../modules/message/message.schema.js";
import AISession from "../modules/ai-session/aiSession.schema.js";
import ChatAnalytics from "../modules/chat-analytics/chatAnalytics.schema.js";
import Organization from "../modules/organization/organization.schema.js";
import * as ragService from "../modules/rag/rag.service.js";
import GroqService from "./grok.service.js";
import GeminiService from "./gemini.service.js";
import { isLLMConfigured } from "../utils/llm.utils.js";
import { generateChatTitle } from "../modules/chat/chat.service.js";

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

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

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

const getFallbackMessage = (orgConfig) => {
  return orgConfig?.ai_config?.fallback_message ||
    "I don't have enough information from our knowledge base to answer that question. Please contact support for assistance.";
};

export async function* streamAIResponse({ chatId, userId, userMessage, organizationId }) {
  const startTime = Date.now();
  const intent = detectIntent(userMessage);
  const orgConfig = await Organization.findById(organizationId).lean();

  const aiConfig = orgConfig?.ai_config || {};
  const modelProvider = aiConfig.provider || "groq";
  const temperature = aiConfig.temperature ?? 0.7;
  const maxTokens = aiConfig.max_tokens ?? 1024;
  const topK = aiConfig.top_k_retrieval ?? 5;
  const threshold = aiConfig.similarity_threshold ?? 0.75;
  const systemPromptOverride = aiConfig.system_prompt_override || "";
  const fallbackMsg = getFallbackMessage(orgConfig);
  const appName = orgConfig?.branding?.app_name || "Support AI";

  if (intent === "greeting") {
    const response = pick(greetings);
    yield { type: "token", content: response };
    yield { type: "done", meta: { intent, model: "intent-fallback", tokensUsed: 0, ragChunksUsed: 0 } };
    await persistInteraction(chatId, userId, organizationId, userMessage, response, intent, 0, 0, Date.now() - startTime, "intent-fallback", 0);
    return;
  }

  if (intent === "farewell") {
    const response = pick(farewells);
    yield { type: "token", content: response };
    yield { type: "done", meta: { intent, model: "intent-fallback", tokensUsed: 0, ragChunksUsed: 0 } };
    await persistInteraction(chatId, userId, organizationId, userMessage, response, intent, 0, 0, Date.now() - startTime, "intent-fallback", 0);
    return;
  }

  if (intent === "thanks") {
    const response = pick(thankResponses);
    yield { type: "token", content: response };
    yield { type: "done", meta: { intent, model: "intent-fallback", tokensUsed: 0, ragChunksUsed: 0 } };
    await persistInteraction(chatId, userId, organizationId, userMessage, response, intent, 0, 0, Date.now() - startTime, "intent-fallback", 0);
    return;
  }

  const titlePromise = generateChatTitle(chatId, userMessage);

  const ragResults = await ragService.hybridQuery(userMessage, null, topK, userId, chatId, organizationId).catch(() => null);
  const relevantChunks = ragResults?.document_results?.filter((r) => r.score >= threshold) || [];
  const ragChunksUsed = relevantChunks.length;

  if (ragChunksUsed === 0 && !isLLMConfigured()) {
    yield { type: "token", content: fallbackMsg };
    yield { type: "done", meta: { intent, model: "fallback", tokensUsed: 0, ragChunksUsed: 0 } };
    await persistInteraction(chatId, userId, organizationId, userMessage, fallbackMsg, intent, 0, 0, Date.now() - startTime, "fallback", 0);
    return;
  }

  const context = relevantChunks.map((c) => c.content).join("\n\n---\n\n");
  const recentMessages = await Message.find({ chat_id: chatId })
    .sort({ created_at: -1 }).limit(6).lean().catch(() => []);
  const convContext = recentMessages.reverse()
    .map((m) => `${m.is_ai ? "Assistant" : "User"}: ${m.content}`)
    .join("\n");

  const systemPrompt = systemPromptOverride || `You are a helpful AI customer support assistant for ${appName}.
Answer ONLY using the provided context. If the context doesn't contain enough information, say: "${fallbackMsg}"
Be concise, professional, and friendly. Use markdown formatting when helpful.`;

  const messages = [{ role: "system", content: systemPrompt }];
  if (context) {
    messages.push({ role: "system", content: `Relevant context:\n${context}` });
  }
  if (convContext) {
    messages.push({ role: "system", content: `Conversation history:\n${convContext}` });
  }
  messages.push({ role: "user", content: userMessage });

  let fullResponse = "";
  let modelUsed = modelProvider;
  let totalTokens = 0;

  try {
    let streamGenerator;

    if (modelProvider === "gemini") {
      const geminiService = new GeminiService();
      streamGenerator = geminiService.streamChatCompletion({ messages, temperature, maxTokens });
    } else {
      const groqService = new GroqService();
      streamGenerator = groqService.streamChatCompletion({ messages, temperature, maxTokens });
    }

    for await (const chunk of streamGenerator) {
      if (chunk.content) {
        fullResponse += chunk.content;
        yield { type: "token", content: chunk.content };
      }
    }

    modelUsed = modelProvider;
    totalTokens = Math.ceil((userMessage.length + fullResponse.length) / 4);
  } catch (err) {
    console.error("[Streaming] LLM call failed:", err.message);
    if (ragChunksUsed > 0) {
      const fallbackFromChunks = relevantChunks.map((c) => c.content).join("\n\n");
      fullResponse = `Based on our documentation:\n\n${fallbackFromChunks}`;
    } else {
      fullResponse = fallbackMsg;
    }
    modelUsed = "fallback-error";
    yield { type: "token", content: fullResponse };
  }

  const title = await titlePromise;

  yield {
    type: "done",
    meta: {
      intent,
      model: modelUsed,
      tokensUsed: totalTokens,
      ragChunksUsed,
      title: title || undefined,
    },
  };

  await persistInteraction(chatId, userId, organizationId, userMessage, fullResponse, intent, ragChunksUsed, 0, Date.now() - startTime, modelUsed, totalTokens);
}

async function persistInteraction(chatId, userId, organizationId, query, response, intent, ragChunksUsed, kgNodesUsed, responseTimeMs, modelUsed, tokensUsed) {
  try {
    await Message.create({
      chat_id: chatId,
      sender_id: userId,
      content: response,
      message_type: "text",
      is_ai: true,
    });

    await AISession.findOneAndUpdate(
      { chat_id: chatId },
      {
        $inc: { messages_count: 2, tokens_used: tokensUsed },
        $set: { model: modelUsed, organization_id: organizationId },
        $push: {
          interactions: {
            $each: [{
              query,
              response,
              intent,
              rag_chunks_used: ragChunksUsed,
              kg_nodes_used: kgNodesUsed,
              response_time_ms: responseTimeMs,
              tokens_used: tokensUsed,
              created_at: new Date(),
            }],
            $slice: -50,
          },
        },
      },
      { upsert: true, new: true }
    );

    await ChatAnalytics.findOneAndUpdate(
      { chat_id: chatId },
      {
        $setOnInsert: { organization_id: organizationId },
        $inc: { total_messages: 1, ai_messages: 1 },
        $set: {
          avg_response_time_ms: responseTimeMs,
        },
      },
      { upsert: true }
    );
  } catch (err) {
    console.error("[Streaming] Persist failed:", err.message);
  }
}
