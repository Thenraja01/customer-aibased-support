import * as ragService from "../rag/rag.service.js";
import * as memoryService from "../memory/memory.service.js";
import * as knowledgeGapService from "../knowledge-gap/knowledgeGap.service.js";
import * as ticketService from "../ticket/ticket.service.js";
import * as ticketMessageService from "../ticket/ticketMessage.service.js";
import * as auditLogService from "../audit-log/auditLog.service.js";
import Message from "../message/message.schema.js";
import AISession from "../ai-session/aiSession.schema.js";
import Document from "../document/document.schema.js";
import User from "../user/user.schema.js";
import Organization from "../organization/organization.schema.js";
import AIConfig from "../ai/schemas/aiConfig.schema.js";
import { decrypt } from "../../utils/crypto.utils.js";
import { recordAIUsage } from "../ai/ai.service.js";
import mongoose from "mongoose";
import { generateResponse } from "../llm/llm.service.js";
import {
  SYSTEM_PROMPT,
  buildPrompt,
  buildUserProfile,
  buildFaqContext,
  buildKnowledgeGapContext,
  getRelevantFaqs,
  getKnowledgeGapHints,
} from "../llm/prompt.js";
import {
  checkInputGuardrails,
  detectPromptInjection,
} from "./guardrails.service.js";
import { rewriteQuery } from "./queryRewrite.service.js";
import { determineAccessScope } from "./accessScope.service.js";
import { computeConfidence, determineResponseMode } from "./confidence.service.js";
import { getCache } from "../../config/redis.js";
import { getResponseCache, setResponseCache } from "../../services/promptCache.service.js";

const MIN_RAG_SCORE = Number(process.env.LLM_MIN_RAG_SCORE) || 0.35;
const MAX_CONV_CHARS = Number(process.env.LLM_MAX_CONV_CHARS) || 3000;
// BUG FIX: FAQ minimum score — was hardcoded 0.3 in prompt.js filter, causing false positives
const FAQ_MIN_SCORE = Number(process.env.FAQ_MIN_SCORE) || 0.6;

const systemPrompt = process.env.LLM_SYSTEM_PROMPT || SYSTEM_PROMPT;

// ── Rate limiting (Redis-backed for multi-process safety) ─────────────

const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000;
const RATE_LIMIT_MAX_MESSAGES = 20;

const checkRateLimit = async (key) => {
  const cache = getCache();
  const redisKey = `rl:${key}`;
  const now = Date.now();

  try {
    const raw = await cache.get(redisKey);
    if (raw) {
      const entry = JSON.parse(raw);
      if (now - entry.windowStart <= RATE_LIMIT_WINDOW_MS) {
        entry.count += 1;
        const remaining = RATE_LIMIT_MAX_MESSAGES - entry.count;
        if (remaining < 0) {
          return {
            allowed: false,
            resetIn: RATE_LIMIT_WINDOW_MS - (now - entry.windowStart),
          };
        }
        await cache.set(redisKey, JSON.stringify(entry), RATE_LIMIT_WINDOW_MS);
        return { allowed: true, remaining };
      }
    }
    // New window
    const fresh = { windowStart: now, count: 1 };
    await cache.set(redisKey, JSON.stringify(fresh), RATE_LIMIT_WINDOW_MS);
    return { allowed: true, remaining: RATE_LIMIT_MAX_MESSAGES - 1 };
  } catch {
    // Cache error → allow request (fail open, non-critical)
    return { allowed: true, remaining: RATE_LIMIT_MAX_MESSAGES };
  }
};

// ── Intent detection ──────────────────────────────────────────────────

const detectIntent = (text) => {
  const lower = text.toLowerCase().trim();
  const cleaned = lower.replace(/[^\w\s]/g, "");

  if (lower.includes("?")) return "question";

  if (
    ["hi", "hello", "hey", "good morning", "good evening", "good afternoon", "howdy", "sup"].some(
      (g) => cleaned === g || cleaned.startsWith(g + " ")
    )
  ) {
    return "greeting";
  }

  if (["thank you", "thanks", "thx", "ty", "appreciate"].some((t) => cleaned.includes(t))) {
    return "thanks";
  }

  if (["bye", "goodbye", "see you", "see ya", "talk later"].some((b) => cleaned.includes(b))) {
    return "farewell";
  }

  return "question";
};

const isGreetingIntent = (intent) =>
  intent === "greeting" || intent === "thanks" || intent === "farewell";

// Operational / copilot-style queries (DB questions like "show pending tickets")
// are NOT knowledge-base questions and must never be recorded as knowledge gaps.
const OPERATIONAL_SUBJECTS = [
  "ticket", "user", "order", "branch", "notification", "report", "faq",
  "refund", "customer", "document", "inventory", "product",
];
const OPERATIONAL_VERBS = [
  "how many", "count", "list", "show", "display", "get", "total", "create",
  "update", "assign", "delete", "disable", "status of", "pending", "open tickets",
  "closed", "resolved",
];

export const isOperationalQuery = (text) => {
  if (!text || typeof text !== "string") return false;
  const lower = text.toLowerCase().trim();
  if (!lower) return false;
  const hasSubject = OPERATIONAL_SUBJECTS.some((s) => lower.includes(s));
  const hasVerb = OPERATIONAL_VERBS.some((v) => lower.includes(v));
  return hasSubject && hasVerb;
};

export const shouldLogKnowledgeGap = ({ orgHasKnowledgeBase, intent, userMessage }) => {
  // No knowledge base → nothing to measure a gap against.
  if (!orgHasKnowledgeBase) return false;
  // Small-talk / greetings are already answered before RAG runs.
  if (isGreetingIntent(intent)) return false;
  // Copilot-style DB questions are handled by the Business AI Copilot, not the KB.
  if (isOperationalQuery(userMessage)) return false;
  return true;
};

// ── Utilities ─────────────────────────────────────────────────────────

const getDocumentTitles = async (documentIds) => {
  if (!documentIds || documentIds.length === 0) return {};
  const docs = await Document.find({ _id: { $in: documentIds } })
    .select("_id title")
    .lean();
  const map = {};
  docs.forEach((d) => { map[d._id.toString()] = d.title; });
  return map;
};

const formatRAGContext = (documentResults, docTitles, similarityThreshold = MIN_RAG_SCORE) => {
  if (!documentResults || documentResults.length === 0) return null;

  const sorted = [...documentResults].sort((a, b) => b.score - a.score);
  const bestScore = sorted[0].score;
  const minScore = Math.max(similarityThreshold, bestScore * 0.6);

  let relevant = sorted.filter((r) => r.score >= minScore).slice(0, 5);
  if (relevant.length === 0) relevant = sorted.slice(0, 1);

  return relevant
    .map((r) => {
      const docId = r.document_id?.toString();
      const title = docTitles[docId] || "Untitled";
      return `[Source: ${title}] ${r.content}`;
    })
    .join("\n\n");
};

/**
 * Build citation list from RAG results for the API response.
 * Returned to the client — not injected into the LLM prompt.
 */
const buildCitations = (documentResults, docTitles, similarityThreshold = MIN_RAG_SCORE) => {
  if (!documentResults || documentResults.length === 0) return [];
  return documentResults
    .filter((r) => r.score >= similarityThreshold)
    .slice(0, 5)
    .map((r) => ({
      documentId: r.document_id?.toString(),
      title: docTitles[r.document_id?.toString()] || "Untitled",
      score: parseFloat((r.score || 0).toFixed(4)),
      excerpt: (r.content || "").slice(0, 200),
    }));
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

const createSystemMessage = async (chatId, senderId, content) =>
  Message.create({
    chat_id: chatId,
    sender_id: senderId,
    content,
    message_type: "text",
    is_ai: true,
  }).catch(() => null);

const stripInternalGuidance = (text) => {
  if (!text) return text;
  let cleaned = text;
  cleaned = cleaned.replace(/\[Confidence:\s*(LOW|MEDIUM|HIGH)\][^\n]*/gi, "");
  cleaned = cleaned.replace(/=== INTERNAL RESPONSE GUIDANCE[\s\S]*?USER QUESTION ===/g, "");
  cleaned = cleaned.replace(/\bNote:\s*The user's question is related to the retrieved context[^\n]*/gi, "");
  return cleaned.trim();
};

const GOLDEN_REPLIES = {
  greeting: "Hello! I'm here to help. How can I assist you today?",
  thanks: "You're welcome! Is there anything else I can help you with?",
  farewell: "Goodbye! Feel free to reach out if you need anything else.",
};

// ── Main AI message processor ─────────────────────────────────────────

export const processAIMessage = async ({
  chatId,
  userId,
  userMessage,
  organizationId,
  roleName,
  roleId,
}) => {
  const intent = detectIntent(userMessage);

  let effectiveOrgId = organizationId;
  let currentUser = null;
  let currentOrg = null;

  // Fetch user + org in parallel (single pass — prompt.js will reuse this data)
  if (userId) {
    [currentUser, currentOrg] = await Promise.all([
      User.findById(userId).select("name email phone role roleName organization_id branch_id").lean().catch(() => null),
      Organization.findById(effectiveOrgId)
        .select("name address email brand_colors customPrompt ai_settings guardrails")
        .lean()
        .catch(() => null),
    ]);
    if (!effectiveOrgId && currentUser?.organization_id) {
      effectiveOrgId = currentUser.organization_id._id || currentUser.organization_id;
    }
  } else if (effectiveOrgId) {
    currentOrg = await Organization.findById(effectiveOrgId)
      .select("name address email brand_colors customPrompt ai_settings guardrails")
      .lean()
      .catch(() => null);
  }

  // Load active organization AI Config
  let activeConfig = null;
  let decryptedApiKey = null;
  if (effectiveOrgId) {
    activeConfig = await AIConfig.findOne({ organization_id: effectiveOrgId, default: true, enabled: true }).lean();
    if (!activeConfig) {
      // Fallback to first enabled config
      activeConfig = await AIConfig.findOne({ organization_id: effectiveOrgId, enabled: true }).lean();
    }
    if (activeConfig && activeConfig.apiKey) {
      decryptedApiKey = decrypt(activeConfig.apiKey);
    }
  }

  const effectiveRoleName = roleName || "public";
  const effectiveRoleId = roleId;
  const effectiveUserId = userId;

  // ── Rate limiting (Redis-backed) ───────────────────────────────────
  const rateLimitKey = `${effectiveOrgId || "anon"}:${effectiveUserId || chatId}`;
  const rl = await checkRateLimit(rateLimitKey);
  if (!rl.allowed) {
    const rateMsg =
      "I'm receiving a lot of requests right now. Please wait a moment and try again.";
    await createSystemMessage(chatId, effectiveUserId || null, rateMsg);
    await AISession.findOneAndUpdate(
      { chat_id: chatId },
      { $inc: { messages_count: 1, tokens_used: 0 } },
      { upsert: true, new: true }
    ).catch(() => null);
    return { content: rateMsg, is_ai: true, rateLimited: true };
  }

  // ── Store user message ─────────────────────────────────────────────
  const anonUserMessage = await Message.create({
    chat_id: chatId,
    sender_id: effectiveUserId || null,
    content: userMessage,
    message_type: "text",
    is_ai: false,
  }).catch(() => null);

  // Connect to the ticket management system
  if (effectiveUserId) {
    try {
      const Ticket = mongoose.model("Ticket");
      const Chat = mongoose.model("Chat");
      let ticket = await Ticket.findOne({ "escalated_from_chat.chat_id": chatId });
      const chatDoc = await Chat.findById(chatId).lean();
      
      if (!ticket) {
        // Automatically create a support ticket for this chat conversation
        const ticketData = {
          user_id: effectiveUserId,
          organization_id: effectiveOrgId,
          branch_id: chatDoc?.branch_id || currentUser?.branch_id || null,
          subject: chatDoc?.topic || userMessage.substring(0, 50) || "Support Chat Query",
          description: userMessage,
          category: "question",
          status: "open",
          priority: "medium",
          escalated_from_chat: {
            chat_id: chatId,
            conversation_preview: `User: ${userMessage}`
          }
        };
        await ticketService.createTicket(ticketData, effectiveOrgId, ticketData.branch_id);
      } else {
        // Append the message to the existing ticket
        ticket.escalated_from_chat.conversation_preview = `${ticket.escalated_from_chat.conversation_preview || ""}\n\nUser: ${userMessage}`.substring(0, 2000);
        if (ticket.status === "waiting_for_customer") {
          ticket.status = "in_progress";
        }
        await ticket.save();

        await ticketMessageService.createMessage({
          ticket_id: ticket._id,
          organization_id: ticket.organization_id,
          branch_id: ticket.branch_id,
          sender_id: effectiveUserId,
          content: userMessage,
          attachments: [],
          is_internal: false
        }).catch((err) => console.error("[SyncChatToTicket] Failed to create TicketMessage:", err.message));
      }
    } catch (err) {
      console.error("[SyncChatToTicket] Sync error:", err.message);
    }
  }

  await AISession.findOneAndUpdate(
    { chat_id: chatId },
    { $inc: { messages_count: 1, tokens_used: Math.ceil(userMessage.length / 4) } },
    { upsert: true, new: true }
  ).catch(() => null);

  // ── Access verification ────────────────────────────────────────────
  const userBranchId = currentUser?.branch_id || null;
  const accessResult = await ragService.verifyAccess(effectiveOrgId, effectiveRoleName, effectiveRoleId, userBranchId);

  if (accessResult.authorized === false) {
    const denialMap = {
      no_org: "Your account is not associated with a valid organization. Please contact your administrator.",
      org_not_found: "Your organization could not be found. Contact your administrator.",
      org_inactive: "Your organization account is inactive. Contact your administrator.",
    };
    const denialText = denialMap[accessResult.reason];

    if (denialText) {
      console.warn(`[AIChat] Access denied for chat ${chatId}: ${accessResult.reason}`);
      await createSystemMessage(chatId, effectiveUserId || anonUserMessage?._id || null, denialText);
      await AISession.findOneAndUpdate(
        { chat_id: chatId },
        { $inc: { messages_count: 1 } },
        { upsert: true, new: true }
      ).catch(() => null);
      await memoryService
        .appendToShortTerm(chatId, {
          role: "assistant",
          content: denialText,
          sender: "Support Assistant",
          timestamp: new Date(),
        })
        .catch(() => null);
      await auditLogService
        .logAction({
          user_id: effectiveUserId || anonUserMessage?._id || null,
          action: "chat_access_denied",
          table_name: "chats",
          record_id: chatId,
          old_value: null,
          new_value: { reason: accessResult.reason, organizationId: effectiveOrgId },
        })
        .catch(() => null);
      return { content: denialText, is_ai: true };
    }

    // role_not_authorized → no approved docs for this role/org.
    // Priority 5: do NOT fall back to general knowledge.
    // Instead, inform the user their role doesn't have access.
    console.warn(
      `[AIChat] No approved documents for role "${effectiveRoleName}" in org ${effectiveOrgId}`
    );
  }

  // ── Input guardrails ───────────────────────────────────────────────
  const guardrailResult = await checkInputGuardrails(userMessage, effectiveOrgId);
  let safeMessage = guardrailResult.sanitizedContent;

  // BUG FIX: early-exit if safeMessage is empty after guardrails
  if (!safeMessage || safeMessage.trim().length === 0) {
    const emptyMsg =
      "I'm sorry, I couldn't process your request. Please try rephrasing your message.";
    await createSystemMessage(chatId, effectiveUserId || anonUserMessage?._id || null, emptyMsg);
    return { content: emptyMsg, is_ai: true };
  }

  if (!guardrailResult.passed && guardrailResult.violations.every((v) => v.rule === "sensitive_topic")) {
    const blockText =
      "I'm sorry, but I can't help with requests related to that topic. Please contact support directly.";
    await createSystemMessage(chatId, effectiveUserId || anonUserMessage?._id || null, blockText);
    await auditLogService
      .logAction({
        user_id: effectiveUserId || anonUserMessage?._id || null,
        action: "chat_guardrail_blocked",
        table_name: "chats",
        record_id: chatId,
        old_value: null,
        new_value: { reason: "sensitive_topic", message: userMessage },
      })
      .catch(() => null);
    return { content: blockText, is_ai: true };
  }

  // ── Prompt injection detection ─────────────────────────────────────
  const injectionResult = detectPromptInjection(userMessage);
  if (injectionResult.isInjected && injectionResult.confidence > 0.7) {
    const injectionText =
      "I'm sorry, but I can't assist with that request. Please rephrase your question.";
    await createSystemMessage(chatId, effectiveUserId || anonUserMessage?._id || null, injectionText);
    await auditLogService
      .logAction({
        user_id: effectiveUserId || anonUserMessage?._id || null,
        action: "chat_injection_detected",
        table_name: "chats",
        record_id: chatId,
        old_value: null,
        new_value: { confidence: injectionResult.confidence, message: userMessage },
      })
      .catch(() => null);
    return { content: injectionText, is_ai: true };
  }

  // ── Golden replies for greeting/small-talk (no RAG, no LLM) ────────
  if (isGreetingIntent(intent)) {
    const reply = GOLDEN_REPLIES[intent] || "Hello! I'm here to help. How can I assist you today?";
    console.log(`[AIChat] Intent="${intent}" → early golden reply for chat ${chatId}`);
    await createSystemMessage(chatId, effectiveUserId || anonUserMessage?._id || null, reply);
    await AISession.findOneAndUpdate(
      { chat_id: chatId },
      { $inc: { messages_count: 1, tokens_used: Math.ceil(reply.length / 4) } },
      { upsert: true, new: true }
    ).catch(() => null);
    await memoryService
      .appendToShortTerm(chatId, {
        role: "assistant",
        content: reply,
        sender: "Support Assistant",
        timestamp: new Date(),
      })
      .catch(() => null);
    await auditLogService
      .logAction({
        user_id: effectiveUserId || anonUserMessage?._id || null,
        action: "chat_greeting_reply",
        table_name: "chats",
        record_id: chatId,
        old_value: null,
        new_value: { intent, response: reply },
      })
      .catch(() => null);
    return { content: reply, is_ai: true };
  }

  // ── Conversation context ───────────────────────────────────────────
  const recentMessages = await Message.find({ chat_id: chatId })
    .sort({ created_at: -1 })
    .limit(20)
    .lean()
    .catch(() => []);

  const convCtx = buildConversationContext(recentMessages);
  const rewrittenQuery = await rewriteQuery(safeMessage, convCtx);

  // ── FAQ cache (checked before vector search) ───────────────────────
  const [faqs, knowledgeGaps] = await Promise.all([
    getRelevantFaqs(effectiveOrgId, safeMessage).catch(() => []),
    getKnowledgeGapHints(effectiveOrgId, safeMessage).catch(() => []),
  ]);

  // BUG FIX: FAQ threshold raised from 0.3 → FAQ_MIN_SCORE (default 0.6)
  // Low-score FAQ matches were causing false positives and bypassing RAG entirely
  const highConfidenceFaq = faqs.find((f) => (f.score || 0) >= FAQ_MIN_SCORE);
  if (highConfidenceFaq) {
    const faqAnswer = highConfidenceFaq.answer;
    const faqSource = `FAQ: ${highConfidenceFaq.category ? highConfidenceFaq.category + " | " : ""}${highConfidenceFaq.question}`;
    const reply = `${faqAnswer}\n\n*Source: ${faqSource}*`;
    console.log(
      `[AIChat] FAQ match for chat ${chatId}: "${highConfidenceFaq.question}" (score=${highConfidenceFaq.score?.toFixed?.(4)})`
    );
    await createSystemMessage(chatId, effectiveUserId || anonUserMessage?._id || null, reply);
    await AISession.findOneAndUpdate(
      { chat_id: chatId },
      { $inc: { messages_count: 1, tokens_used: Math.ceil(reply.length / 4) } },
      { upsert: true, new: true }
    ).catch(() => null);
    await memoryService
      .appendToShortTerm(chatId, {
        role: "assistant",
        content: reply,
        sender: "Support Assistant",
        timestamp: new Date(),
      })
      .catch(() => null);
    await auditLogService
      .logAction({
        user_id: effectiveUserId || anonUserMessage?._id || null,
        action: "chat_faq_response",
        table_name: "chats",
        record_id: chatId,
        old_value: null,
        new_value: {
          faqQuestion: highConfidenceFaq.question,
          score: highConfidenceFaq.score,
          source: faqSource,
        },
      })
      .catch(() => null);
    return {
      content: reply,
      is_ai: true,
      source: "faq",
      confidence: highConfidenceFaq.score,
    };
  }

  // ── Response cache check (before embedding/RAG) ────────────────────
  const accessScopeForCache = accessResult.accessScope || null;
  const roleCacheFilter = accessScopeForCache?.roleFilter ?? null;

  const cachedResponse = await getResponseCache(effectiveOrgId, roleCacheFilter, rewrittenQuery);
  if (cachedResponse) {
    console.log(`[AIChat] Response cache HIT for chat ${chatId}`);
    const cachedMsg = await createSystemMessage(
      chatId,
      effectiveUserId || anonUserMessage?._id || null,
      cachedResponse.text
    );
    await AISession.findOneAndUpdate(
      { chat_id: chatId },
      { $inc: { messages_count: 1, tokens_used: Math.ceil(cachedResponse.text.length / 4) } },
      { upsert: true, new: true }
    ).catch(() => null);
    return {
      ...(cachedMsg?.toObject ? cachedMsg.toObject() : cachedMsg),
      confidence: cachedResponse.confidence,
      responseMode: cachedResponse.responseMode,
      citations: cachedResponse.citations || [],
      fromCache: true,
    };
  }

  // ── Memory retrieval ───────────────────────────────────────────────
  const memResults = await memoryService
    .getRelevantMemories(effectiveUserId, safeMessage, 5, effectiveOrgId)
    .catch(() => []);
  const formattedMemCtx = formatMemoryContext(memResults);

  // ── Access scope ───────────────────────────────────────────────────
  const effectiveAccessScope = accessResult.accessScope || {
    roleName: effectiveRoleName,
    roleFilter: ragService.getRoleFilter(effectiveRoleName),
    authorizedDocumentIds: null,
    statusFilter: "published",
  };

  console.log(
    `[AIChat] RAG scope: authorized=${accessResult.authorized} roleName=${effectiveAccessScope.roleName}`
  );

  // ── RAG search ─────────────────────────────────────────────────────
  const ragResults = await ragService
    .searchWithScope(
      rewrittenQuery,
      effectiveOrgId,
      effectiveAccessScope,
      5,
      effectiveUserId,
      chatId
    )
    .catch(() => ({
      document_results: [],
      memory_context: "",
      memory_results: [],
      total: 0,
      authorized: true,
      reason: null,
    }));

  console.log(
    `[AIChat] RAG results: ${ragResults?.document_results?.length || 0} chunks | bestScore=${
      ragResults?.document_results?.[0]?.score?.toFixed?.(4) ?? "n/a"
    }`
  );

  // ── Priority 5: Check if the org has a knowledge base at all ───────
  // If the org has approved docs, the LLM must NEVER fall back to general knowledge.
  const orgHasKnowledgeBase = await ragService
    .hasApprovedDocuments(effectiveOrgId)
    .catch(() => false);

  console.log(`[AIChat] orgHasKnowledgeBase=${orgHasKnowledgeBase}`);

  // ── Document titles & citations ────────────────────────────────────
  const docIds = new Set();
  if (ragResults?.document_results) {
    ragResults.document_results.forEach((r) => {
      if (r.document_id) docIds.add(r.document_id.toString());
    });
  }
  const docTitles = await getDocumentTitles([...docIds]);

  const orgSettings = currentOrg?.ai_settings || {};
  const similarityThreshold = activeConfig?.configuration?.similarity_threshold ?? orgSettings.similarity_threshold ?? MIN_RAG_SCORE;

  // Priority 5: When access is restricted but org HAS docs, never say "use general knowledge"
  let ragCtx;
  if (ragResults?.authorized === false) {
    ragCtx = orgHasKnowledgeBase
      ? "[Access Restricted] Your role does not have access to the organization's knowledge base. You must NOT answer from general knowledge. State that the information is not available for the user's role."
      : "[No Knowledge Base] This organization has not uploaded any documentation yet.";
  } else {
    ragCtx = formatRAGContext(ragResults.document_results, docTitles, similarityThreshold);
  }

  // ── Citations (returned in API response, not injected into prompt) ─
  const citations = buildCitations(ragResults.document_results || [], docTitles, similarityThreshold);

  // ── Confidence computation ─────────────────────────────────────────
  const confidenceResult = computeConfidence(ragResults, faqs, safeMessage);
  const responseMode = determineResponseMode(confidenceResult, orgSettings);

  console.log(
    `[AIChat] Confidence: ${confidenceResult.confidence?.toFixed?.(4)} mode=${responseMode.mode}`
  );

  // ── Internal guidance (not exposed to user) ────────────────────────
  // Priority 5: When org has docs, guidance must explicitly prohibit general knowledge
  let internalGuidance = "";
  if (responseMode.mode === "no_confidence") {
    internalGuidance = orgHasKnowledgeBase
      ? "\n\n=== INTERNAL RESPONSE GUIDANCE (DO NOT REPEAT THIS TO THE USER) ===\nThe retrieved knowledge has very low relevance. This organization HAS a knowledge base, so you MUST NOT answer from general knowledge. State clearly that you could not find the information in the approved documentation and suggest the user contact support or rephrase their question."
      : "\n\n=== INTERNAL RESPONSE GUIDANCE (DO NOT REPEAT THIS TO THE USER) ===\nThe retrieved knowledge has very low relevance. State your uncertainty clearly, ask a clarifying question if needed, and never fabricate company-specific answers.";
  } else if (responseMode.mode === "suggest_and_offer_human") {
    internalGuidance = "\n\n=== INTERNAL RESPONSE GUIDANCE (DO NOT REPEAT THIS TO THE USER) ===\nThe retrieved knowledge is moderately relevant. Answer as best you can using ONLY the retrieved documents, then naturally mention the user can ask for more detail or be connected with a human agent.";
  }

  // ── Build prompt ───────────────────────────────────────────────────
  const userProfile = buildUserProfile(currentUser, currentOrg);
  const faqContext = buildFaqContext(faqs);
  const knowledgeGapContext = buildKnowledgeGapContext(knowledgeGaps);

  const fullPrompt = await buildPrompt({
    systemPrompt,
    organizationId: effectiveOrgId,
    organization: currentOrg,
    orgHasKnowledgeBase,                // ← Priority 5 flag
    conversationContext: convCtx,
    memoryContext: formattedMemCtx,
    ragContext: ragCtx,
    userMessage: safeMessage,
    userId: effectiveUserId,
    userProfile,
    faqContext,
    knowledgeGapContext,
  });

  const finalPrompt = internalGuidance
    ? fullPrompt.replace("\n\n=== USER QUESTION ===\n", `${internalGuidance}\n\n=== USER QUESTION ===\n`)
    : fullPrompt;

  // ── LLM call ──────────────────────────────────────────────────────
  const provider = activeConfig ? activeConfig.provider : undefined;
  const model = activeConfig ? activeConfig.model : undefined;
  const configSettings = {
    temperature: activeConfig?.configuration?.temperature ?? orgSettings.temperature ?? 0.7,
    maxTokens: activeConfig?.configuration?.max_tokens ?? orgSettings.max_tokens ?? 2048,
  };

  // ── Plan quota check (server-side) ────────────────────────────────
  // Enforces the organization's monthly AI request allowance before any
  // provider call. When exhausted, the assistant returns a polite upgrade
  // message instead of generating.
  const quotaExceeded = await (async () => {
    if (!effectiveOrgId) return false;
    const orgQuota = await Organization.findById(effectiveOrgId)
      .select("ai_requests_limit ai_requests_month")
      .lean()
      .catch(() => null);
    if (!orgQuota || !orgQuota.ai_requests_limit) return false;
    return (orgQuota.ai_requests_month || 0) >= orgQuota.ai_requests_limit;
  })();

  let llmResult;
  let latencyMs = 0;
  if (quotaExceeded) {
    console.warn(`[AIChat] Monthly AI quota exceeded for org ${effectiveOrgId} — using fallback response`);
    llmResult = {
      text: "Your organization has reached its monthly AI request limit. Please contact your administrator to upgrade your plan.",
      provider: "fallback",
    };
  } else {
    const providerStart = Date.now();
    llmResult = await generateResponse(finalPrompt, safeMessage, {
      organizationId: effectiveOrgId,
      provider,
      model,
      apiKey: decryptedApiKey,
      temperature: intent === "greeting" ? 0.8 : configSettings.temperature,
      maxTokens: configSettings.maxTokens,
    });
    latencyMs = Date.now() - providerStart;
  }

  const aiResponseText = typeof llmResult === "string" ? llmResult : llmResult?.text || "";
  let finalResponse = stripInternalGuidance(aiResponseText);

  if (responseMode.mode === "suggest_and_offer_human") {
    const humanOffer =
      "\n\nIf this doesn't fully address your question, I can connect you with a human agent who can provide more detailed assistance.";
    if (!/connect you with a human agent/i.test(finalResponse)) {
      finalResponse += humanOffer;
    }
  }

  // ── Low-confidence: create support ticket ─────────────────────────
  if (responseMode.mode === "no_confidence" && effectiveOrgId && effectiveUserId) {
    ticketService
      .createTicket(
         {
          user_id: effectiveUserId,
          organization_id: effectiveOrgId,
          subject: `Low-confidence query: ${userMessage.substring(0, 50)}`,
          description: `The AI assistant could not confidently answer this query.\n\nQuery: ${userMessage}\n\nAI Response: ${finalResponse}`,
          category: "question",
          priority: "medium",
        },
        effectiveOrgId
      )
      .catch(() => null);
  }

  // ── Cache the response ────────────────────────────────────────────
  await setResponseCache(
    effectiveOrgId,
    roleCacheFilter,
    rewrittenQuery,
    {
      text: finalResponse,
      provider: llmResult?.provider,
      citations,
      confidence: confidenceResult.confidence,
      responseMode: responseMode.mode,
    }
  );

  // ── Record AI Usage ───────────────────────────────────────────────
  if (effectiveOrgId) {
    const inputTokens = Math.ceil(finalPrompt.length / 4);
    const outputTokens = Math.ceil(finalResponse.length / 4);
    const usedProvider = llmResult?.provider || provider || "ollama";
    const usedModel = model || llmResult?.model || process.env.LLM_MODEL || "local";

    // Per-1K-token list prices (USD) — used for cost analytics only.
    const PROVIDER_RATES = {
      gemini: { input: 0.075 / 1000, output: 0.30 / 1000 },
      google: { input: 0.075 / 1000, output: 0.30 / 1000 },
      groq: { input: 0.59 / 1000, output: 0.79 / 1000 },
      grok: { input: 0.30 / 1000, output: 0.50 / 1000 },
      claude: { input: 0.003, output: 0.015 },
    };
    const rate = PROVIDER_RATES[usedProvider] || PROVIDER_RATES.gemini;
    const costUsd = (inputTokens * rate.input) + (outputTokens * rate.output);

    recordAIUsage({
      organization_id: effectiveOrgId,
      user_id: effectiveUserId || null,
      chat_id: chatId,
      model: usedModel,
      provider: usedProvider,
      feature: "chat",
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      cost_usd: costUsd,
      latency_ms: latencyMs,
      endpoint: "/chats/ai",
      success: !!finalResponse && finalResponse.length > 0,
    }).catch((err) => console.error("[recordAIUsage] Failed to record usage:", err.message));

    // Increment the monthly AI request counter used for plan-limit enforcement.
    Organization.updateOne(
      { _id: effectiveOrgId },
      { $inc: { ai_requests_month: 1 } }
    ).catch((err) => console.error("[AIChat] Failed to increment ai_requests_month:", err.message));
  }

  // ── Store AI message ──────────────────────────────────────────────
  const aiMessage = await createSystemMessage(
    chatId,
    effectiveUserId || anonUserMessage?._id || null,
    finalResponse
  );

  if (effectiveUserId) {
    try {
      const Ticket = mongoose.model("Ticket");
      const ticket = await Ticket.findOne({ "escalated_from_chat.chat_id": chatId });
      if (ticket) {
        ticket.escalated_from_chat.conversation_preview = `${ticket.escalated_from_chat.conversation_preview || ""}\n\nAI: ${finalResponse}`.substring(0, 2000);
        await ticket.save();
      }
    } catch (err) {
      console.error("[SyncChatToTicket] AI response sync error:", err.message);
    }
  }

  await AISession.findOneAndUpdate(
    { chat_id: chatId },
    {
      $inc: {
        messages_count: 1,
        tokens_used: Math.ceil((safeMessage.length + finalResponse.length) / 4),
      },
    },
    { upsert: true, new: true }
  ).catch(() => null);

  await memoryService
    .appendToShortTerm(chatId, {
      role: "assistant",
      content: finalResponse,
      sender: "Support Assistant",
      timestamp: new Date(),
    })
    .catch(() => null);

  if (effectiveUserId) {
    memoryService
      .extractAndStoreFacts(effectiveUserId, chatId, [
        { _id: anonUserMessage?._id, role: "user", content: userMessage },
        { _id: aiMessage?._id, role: "assistant", content: finalResponse },
      ])
      .catch(() => null);
  }

  // ── Knowledge gap logging ─────────────────────────────────────────
  let chatBranchId = null;
  try {
    const Chat = mongoose.model("Chat");
    const chatDoc = await Chat.findById(chatId).select("branch_id").lean();
    chatBranchId = chatDoc?.branch_id || null;
  } catch {}

  if (shouldLogKnowledgeGap({ orgHasKnowledgeBase, intent, userMessage })) {
    if (ragResults?.document_results && ragResults.document_results.length > 0) {
      const scores = ragResults.document_results.map((r) => r.score || 0);
      const bestScore = Math.max(...scores);
      const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
      if (bestScore < similarityThreshold) {
        knowledgeGapService
          .logFailedQuery({
            organizationId: effectiveOrgId,
            userId: effectiveUserId,
            chatId,
            query: userMessage,
            bestScore,
            avgScore,
            matchedChunks: ragResults.document_results.length,
            branchId: chatBranchId,
          })
          .catch(() => null);
      }
    } else {
      knowledgeGapService
        .logFailedQuery({
          organizationId: effectiveOrgId,
          userId: effectiveUserId,
          chatId,
          query: userMessage,
          bestScore: 0,
          avgScore: 0,
          matchedChunks: 0,
          branchId: chatBranchId,
        })
        .catch(() => null);
    }
  }

  // ── Audit log ─────────────────────────────────────────────────────
  await auditLogService
    .logAction({
      user_id: effectiveUserId || anonUserMessage?._id || null,
      action: "chat_response_generated",
      table_name: "chats",
      record_id: chatId,
      old_value: null,
      new_value: {
        intent,
        responseMode: responseMode.mode,
        confidence: confidenceResult.confidence,
        source:
          faqs.length > 0
            ? "faq"
            : ragResults?.document_results?.length > 0
            ? "knowledge_base"
            : "general_knowledge",
        tokensUsed: Math.ceil((safeMessage.length + finalResponse.length) / 4),
        citationCount: citations.length,
      },
    })
    .catch(() => null);

  return {
    ...(aiMessage?.toObject ? aiMessage.toObject() : aiMessage),
    confidence: confidenceResult.confidence,
    responseMode: responseMode.mode,
    citations,
    fromCache: false,
  };
};
