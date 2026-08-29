import { getCache } from "../../config/redis.js";

const CONTEXT_TTL = 60 * 60 * 2; // 2 hours context memory TTL

/**
 * Normalizes text to extract potential entity identifiers
 */
export const extractEntityIdentifiers = (text) => {
  if (!text || typeof text !== "string") return {};

  const ticketMatch = text.match(/\b(TK-\d{3,8}|TICKET-\d{3,8}|#\d{4,8})\b/i);
  const txMatch = text.match(/\b(TX-\d{4,10}|TRANS-\d{4,10}|PAY-\d{4,10})\b/i);
  const errMatch = text.match(/\b(ERR-[A-Z0-9_-]{3,12}|REFUND-\d{3,4}|HTTP-\d{3}|50\d|40\d)\b/i);
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/);

  return {
    ticketId: ticketMatch ? ticketMatch[0].toUpperCase() : null,
    transactionId: txMatch ? txMatch[0].toUpperCase() : null,
    errorCode: errMatch ? errMatch[0].toUpperCase() : null,
    customerEmail: emailMatch ? emailMatch[0].toLowerCase() : null,
  };
};

/**
 * Build context key for Redis
 */
const getContextKey = (conversationId, userId) => {
  return `conv_ctx:${conversationId || userId}`;
};

/**
 * Retrieve active conversation state
 */
export const getConversationContext = async (conversationId, userId) => {
  const key = getContextKey(conversationId, userId);
  const cache = getCache();
  try {
    const raw = await cache.get(key);
    if (!raw) {
      return {
        activeTicketId: null,
        activeTransactionId: null,
        activeErrorCode: null,
        activeProduct: null,
        activeService: null,
        activeCustomerId: userId || null,
        previousQuestion: null,
        previousAnswer: null,
        previousIntent: null,
        unresolvedIntent: null,
        turns: [],
      };
    }
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[ConversationContext] Failed to fetch context:", err.message);
    return {
      activeTicketId: null,
      activeTransactionId: null,
      activeErrorCode: null,
      activeProduct: null,
      activeService: null,
      activeCustomerId: userId || null,
      previousQuestion: null,
      previousAnswer: null,
      previousIntent: null,
      unresolvedIntent: null,
      turns: [],
    };
  }
};

/**
 * Update and merge conversation context with new turn details
 */
export const updateConversationContext = async (
  conversationId,
  userId,
  userMessage,
  assistantResponse = "",
  intent = "general_knowledge",
  detectedEntities = {}
) => {
  const key = getContextKey(conversationId, userId);
  const cache = getCache();

  try {
    const existing = await getConversationContext(conversationId, userId);
    const extracted = extractEntityIdentifiers(userMessage);

    const updated = {
      activeTicketId: detectedEntities.ticketId || extracted.ticketId || existing.activeTicketId,
      activeTransactionId: detectedEntities.transactionId || extracted.transactionId || existing.activeTransactionId,
      activeErrorCode: detectedEntities.errorCode || extracted.errorCode || existing.activeErrorCode,
      activeProduct: detectedEntities.product || existing.activeProduct,
      activeService: detectedEntities.service || existing.activeService,
      activeCustomerId: userId || existing.activeCustomerId,
      previousQuestion: userMessage,
      previousAnswer: assistantResponse || existing.previousAnswer,
      previousIntent: intent,
      unresolvedIntent: intent === "unsupported_unknown" ? userMessage : null,
      turns: [
        ...(existing.turns || []).slice(-5), // Keep last 5 turns in buffer
        {
          role: "user",
          content: userMessage,
          intent,
          timestamp: new Date().toISOString(),
        },
        ...(assistantResponse
          ? [
              {
                role: "assistant",
                content: assistantResponse,
                timestamp: new Date().toISOString(),
              },
            ]
          : []),
      ],
    };

    await cache.set(key, JSON.stringify(updated), CONTEXT_TTL);
    return updated;
  } catch (err) {
    console.error("[ConversationContext] Failed to update context:", err.message);
    return {};
  }
};

/**
 * Resolve pronoun or contextual references using active conversation context
 * E.g. "What about mine?" -> "What about my refund for transaction TX-8832?"
 */
export const resolveContextualQuery = (userMessage, context = {}) => {
  if (!userMessage || typeof userMessage !== "string") return userMessage;
  const lower = userMessage.toLowerCase().trim();

  // Handle follow-up references like "mine", "this error", "my ticket", "that transaction"
  let rewritten = userMessage;

  const possessesMine = lower.includes("mine") || lower.includes("my status") || lower.includes("my refund");
  const referencesError = lower.includes("this error") || lower.includes("the error");
  const referencesTicket = lower.includes("my ticket") || lower.includes("this ticket");

  if (possessesMine && context.activeTransactionId) {
    rewritten += ` (Context: Transaction ${context.activeTransactionId})`;
  } else if (possessesMine && context.activeTicketId) {
    rewritten += ` (Context: Ticket ${context.activeTicketId})`;
  }

  if (referencesError && context.activeErrorCode) {
    rewritten += ` (Context: Error ${context.activeErrorCode})`;
  }

  if (referencesTicket && context.activeTicketId) {
    rewritten += ` (Context: Ticket ${context.activeTicketId})`;
  }

  return rewritten;
};
