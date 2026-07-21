import * as ragService from "../rag/rag.service.js";
import * as memoryService from "../memory/memory.service.js";
import Message from "../message/message.schema.js";
import AISession from "../ai-session/aiSession.schema.js";
import Document from "../document/document.schema.js";
import { generateResponse } from "../llm/llm.service.js";
import { SYSTEM_PROMPT, buildPrompt } from "../llm/prompt.js";

const MIN_RAG_SCORE = Number(process.env.LLM_MIN_RAG_SCORE) || 0.35;
const MAX_CONV_CHARS = Number(process.env.LLM_MAX_CONV_CHARS) || 3000;
const systemPrompt = process.env.LLM_SYSTEM_PROMPT || SYSTEM_PROMPT;

const detectIntent = (text) => {
  const lower = text.toLowerCase().trim();
  const cleaned = lower.replace(/[^\w\s]/g, "");

  if (lower.includes("?")) return "question";

  if (["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "howdy", "sup"]
      .some(g => cleaned === g || cleaned.startsWith(g + " "))) {
    return "greeting";
  }

  if (["thank you", "thanks", "thx", "ty", "appreciate"]
      .some(t => cleaned.includes(t))) {
    return "thanks";
  }

  if (["bye", "goodbye", "see you", "see ya", "talk later"]
      .some(b => cleaned.includes(b))) {
    return "farewell";
  }

  return "question";
};

const getDocumentTitles = async (documentIds) => {
  if (!documentIds || documentIds.length === 0) return {};
  const docs = await Document.find({ _id: { $in: documentIds } }).select("_id title").lean();
  const map = {};
  docs.forEach((d) => { map[d._id.toString()] = d.title; });
  return map;
};

const formatRAGContext = (ragResults, docTitles) => {
  if (!ragResults || !ragResults.document_results || ragResults.document_results.length === 0) return null;

  const bestScore = Math.max(...ragResults.document_results.map((r) => r.score));
  const minScore = ragResults.document_results.length === 0 ? 0 : bestScore * 0.6;
  const effectiveMin = Math.max(MIN_RAG_SCORE, minScore);

  const relevant = ragResults.document_results
    .filter((r) => r.score >= effectiveMin)
    .slice(0, 5);

  if (relevant.length === 0) return null;

  return relevant.map((r) => {
    const docId = r.document_id?.toString();
    const title = docTitles[docId] || "Untitled";
    return `[Source: ${title}] ${r.content}`;
  }).join("\n\n");
};

const formatMemoryContext = (memoryResults) => {
  if (!memoryResults || memoryResults.length === 0) return null;
  return memoryResults
    .slice(0, 5)
    .map((m) => `- ${m.content}`)
    .join("\n");
};

const buildConversationContext = (recentMessages) => {
  if (!recentMessages || recentMessages.length === 0) return "";
  let result = "";
  for (const m of recentMessages) {
    const line = `${m.is_ai ? "Assistant" : "User"}: ${m.content}`;
    if ((result + "\n" + line).length > MAX_CONV_CHARS) break;
    result += (result ? "\n" : "") + line;
  }
  return result;
};

export const processAIMessage = async ({ chatId, userId, userMessage, organizationId }) => {
  const intent = detectIntent(userMessage);

  const [ragResults, memoryResults, recentMessages] = await Promise.all([
    ragService.hybridQuery(userMessage, organizationId, null, 5, userId, chatId).catch(() => null),
    memoryService.getRelevantMemories(userId, userMessage, 5).catch(() => []),
    Message.find({ chat_id: chatId }).sort({ created_at: -1 }).limit(20).lean().catch(() => []),
  ]);

  const docIds = new Set();
  if (ragResults?.document_results) {
    ragResults.document_results.forEach((r) => {
      if (r.document_id) docIds.add(r.document_id.toString());
    });
  }
  const docTitles = await getDocumentTitles([...docIds]);

  const convCtx = buildConversationContext(recentMessages.reverse());
  const ragCtx = formatRAGContext(ragResults, docTitles);
  const memCtx = formatMemoryContext(memoryResults);

  const prompt = await buildPrompt({
    systemPrompt,
    organizationId,
    conversationContext: convCtx,
    memoryContext: memCtx,
    ragContext: ragCtx,
    userMessage,
  });

  const aiResponseText = await generateResponse(prompt, userMessage, {
    temperature: intent === "greeting" ? 0.8 : 0.7,
    maxTokens: 2048,
  });

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

  await memoryService.appendToShortTerm(chatId, {
    role: "assistant",
    content: aiResponseText,
    sender: "Support Assistant",
    timestamp: new Date(),
  });

  return aiMessage;
};
