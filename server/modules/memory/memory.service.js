import mongoose from "mongoose";
import ChatMemory from "./memory.schema.js";
import Message from "../message/message.schema.js";
import Chat from "../chat/chat.schema.js";
import { chunkHashMap, keywordIndexMap } from "../rag/hashmap.service.js";
import { getCachedEmbedding } from "../../services/embeddingCache.service.js";

const shortTermCache = new Map();
const SHORT_TERM_TTL = 30 * 60 * 1000;

export const getShortTermMemory = (chatId, limit = 20) => {
  const entry = shortTermCache.get(chatId?.toString());
  if (entry && Date.now() - entry.timestamp < SHORT_TERM_TTL) {
    return entry.messages.slice(-limit);
  }
  return null;
};

export const setShortTermMemory = (chatId, messages) => {
  if (shortTermCache.size > 500) {
    const oldest = shortTermCache.keys().next().value;
    shortTermCache.delete(oldest);
  }
  shortTermCache.set(chatId?.toString(), {
    messages,
    timestamp: Date.now(),
  });
};

// Fetch recent messages from DB and cache in HashMap
export const loadShortTermMemory = async (chatId, limit = 20) => {
  if (!chatId || !mongoose.Types.ObjectId.isValid(chatId)) return [];

  const cached = getShortTermMemory(chatId, limit);
  if (cached) return cached;

  const messages = await Message.find({ chat_id: chatId })
    .populate("sender_id", "name email")
    .sort({ created_at: -1 })
    .limit(limit);

  const formatted = messages.reverse().map((m) => ({
    role: m.is_ai ? "assistant" : "user",
    content: m.content,
    sender: m.sender_id?.name || "Unknown",
    timestamp: m.created_at,
  }));

  setShortTermMemory(chatId, formatted);
  return formatted;
};

// Append a new message to short-term cache
export const appendToShortTerm = (chatId, message) => {
  const entry = shortTermCache.get(chatId?.toString());
  if (entry) {
    entry.messages.push(message);
    entry.timestamp = Date.now();
  }
  return Promise.resolve();
};

// Build conversation context window for the AI
export const buildConversationContext = async (chatId, maxMessages = 10) => {
  const messages = await loadShortTermMemory(chatId, maxMessages);
  if (messages.length === 0) return "";

  return messages
    .map((m) => `${m.role === "assistant" ? "AI" : "User"}: ${m.content}`)
    .join("\n");
};

// Clear short-term memory for a chat
export const clearShortTermMemory = (chatId) => {
  shortTermCache.delete(chatId?.toString());
};

// ── Long-Term Memory (MongoDB + HashMap index) ───────────────────────

// Store a new long-term memory
export const storeMemory = async ({
  user_id,
  chat_id,
  memory_type,
  content,
  keywords = [],
  source_messages = [],
  confidence = 0.8,
  ttl_days = 90,
}) => {
  const embedding = await computeMemoryEmbedding(content);

  const memory = await ChatMemory.create({
    user_id,
    chat_id,
    memory_type,
    content,
    keywords,
    embedding,
    source_messages,
    confidence,
    expires_at: new Date(Date.now() + ttl_days * 24 * 60 * 60 * 1000),
  });

  // Populate keyword HashMap
  if (keywords.length > 0) {
    const key = `memory:${user_id}`;
    for (const kw of keywords) {
      const idxKey = `mem:${kw}`;
      if (!keywordIndexMap.has(idxKey)) keywordIndexMap.set(idxKey, new Set());
      keywordIndexMap.get(idxKey).add(memory._id.toString());
    }
  }

  return memory;
};

// Get all active long-term memories for a user
export const getUserMemories = async (userId, options = {}) => {
  const { memory_type, limit = 50, active_only = true } = options;

  const query = { user_id: userId };
  if (active_only) query.is_active = true;
  if (memory_type) query.memory_type = memory_type;

  return await ChatMemory.find(query)
    .sort({ confidence: -1, created_at: -1 })
    .limit(limit);
};

// Get memories by keyword (HashMap-first, MongoDB fallback)
export const searchMemoriesByKeyword = async (userId, keywords, limit = 10) => {
  const memoryIds = new Set();
  for (const kw of keywords) {
    const idxKey = `mem:${kw}`;
    const ids = keywordIndexMap.get(idxKey) || [];
    ids.forEach((id) => memoryIds.add(id));
  }

  if (memoryIds.size > 0) {
    const memories = await ChatMemory.find({
      _id: { $in: [...memoryIds] },
      user_id: userId,
      is_active: true,
    });
    return memories.slice(0, limit);
  }

  return await ChatMemory.find({
    user_id: userId,
    keywords: { $in: keywords },
    is_active: true,
  }).limit(limit);
};

// Get memories relevant to a query (similarity-based)
// BUG FIX: accepts organizationId for tenant isolation
export const getRelevantMemories = async (userId, query, limit = 5, organizationId = null) => {
  const queryEmbedding = await computeMemoryEmbedding(query);

  const filter = {
    user_id: userId,
    is_active: true,
    embedding: { $exists: true, $ne: [] },
  };
  // Tenant isolation: if organizationId provided, only return memories scoped to that org
  // (Memory schema must have organization_id field; if it doesn't, this is a no-op guard)
  if (organizationId) filter.organization_id = { $in: [organizationId, null, undefined] };

  const memories = await ChatMemory.find(filter).limit(100);

  if (memories.length === 0) return [];

  // If queryEmbedding is null (Ollama down), fall back to recency sort
  if (!queryEmbedding) {
    console.warn("[Memory] Embedding unavailable — returning most recent memories");
    return memories.slice(0, limit).map((m) => ({ ...m.toObject(), relevance: 0 }));
  }

  const scored = memories.map((m) => ({
    ...m.toObject(),
    relevance: cosineSim(queryEmbedding, m.embedding),
  }));

  const topMemories = scored
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit);

  // BUG FIX: use updateOne (fire-and-forget) instead of .save() inside .map()
  // .save() on a plain object (from .toObject()) would have thrown anyway
  const now = new Date();
  const ids = topMemories.map((m) => m._id);
  ChatMemory.updateMany(
    { _id: { $in: ids } },
    { $inc: { access_count: 1 }, $set: { last_accessed_at: now } }
  ).catch((err) => console.warn("[Memory] Failed to update access stats:", err.message));

  return topMemories;
};

// Update a memory
export const updateMemory = async (memoryId, updates) => {
  const memory = await ChatMemory.findByIdAndUpdate(memoryId, updates, {
    new: true,
  });
  if (!memory) throw new Error("Memory not found");
  return memory;
};

// Delete a memory
export const deleteMemory = async (memoryId) => {
  const memory = await ChatMemory.findByIdAndDelete(memoryId);
  if (!memory) throw new Error("Memory not found");
  return { message: "Memory deleted" };
};

// Delete all memories for a user
export const deleteUserMemories = async (userId) => {
  await ChatMemory.deleteMany({ user_id: userId });
  return { message: "All memories deleted for user" };
};

// Archive expired memories (cron-compatible)
export const archiveExpiredMemories = async () => {
  const result = await ChatMemory.updateMany(
    { expires_at: { $lt: new Date() }, is_active: true },
    { $set: { is_active: false } }
  );
  return { archived: result.modifiedCount };
};

// Get memory stats for a user
export const getMemoryStats = async (userId) => {
  const [typeStats, totalActive, shortTermSize] = await Promise.all([
    ChatMemory.aggregate([
      { $match: { user_id: userId, is_active: true } },
      { $group: { _id: "$memory_type", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    ChatMemory.countDocuments({ user_id: userId, is_active: true }),
    shortTermCache.size,
  ]);

  return {
    total_active: totalActive,
    by_type: typeStats,
    short_term_cache_size: shortTermSize,
    short_term_ttl_ms: SHORT_TERM_TTL,
  };
};

// ── Extract facts from conversation and store as long-term memory ────

export const extractAndStoreFacts = async (userId, chatId, messages) => {
  const stored = [];

  for (const msg of messages) {
    if (msg.role !== "user") continue;

    const text = msg.content.toLowerCase();

    const facts = [];

    if (text.match(/my name is|i am|i'm called|call me/)) {
      const nameMatch = msg.content.match(
        /(?:my name is|i am|i'm|call me)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i
      );
      if (nameMatch) {
        facts.push({
          memory_type: "fact",
          content: `User's name is ${nameMatch[1].trim()}`,
          keywords: ["name", nameMatch[1].toLowerCase()],
          confidence: 0.95,
        });
      }
    }

    if (text.match(/i work at|i'm a|i am a|my job|my role is|my company/)) {
      facts.push({
        memory_type: "fact",
        content: `Work-related info: ${msg.content.substring(0, 200)}`,
        keywords: extractKeywordsSimple(msg.content),
        confidence: 0.85,
      });
    }

    if (text.match(/i prefer|i like|i want|i need|i always|i usually/)) {
      facts.push({
        memory_type: "preference",
        content: `User preference: ${msg.content.substring(0, 200)}`,
        keywords: extractKeywordsSimple(msg.content),
        confidence: 0.8,
      });
    }

    if (text.match(/i forgot|reminder|don't forget|remember that/)) {
      facts.push({
        memory_type: "context",
        content: msg.content.substring(0, 200),
        keywords: extractKeywordsSimple(msg.content),
        confidence: 0.9,
      });
    }

    if (text.match(/never mind|ignore|disregard/)) {
      continue;
    }

    for (const fact of facts) {
      const stored_memory = await storeMemory({
        user_id: userId,
        chat_id: chatId,
        memory_type: fact.memory_type,
        content: fact.content,
        keywords: fact.keywords,
        confidence: fact.confidence,
        source_messages: [msg._id],
      });
      stored.push(stored_memory);
    }
  }

  return stored;
};

// ── Build full memory context for AI response generation ──────────────

export const buildFullContext = async (userId, chatId, query, maxShortTerm = 10, maxLongTerm = 5) => {
  const [shortTerm, longTerm] = await Promise.all([
    buildConversationContext(chatId, maxShortTerm),
    getRelevantMemories(userId, query, maxLongTerm),
  ]);

  const parts = [];

  if (longTerm.length > 0) {
    parts.push("=== USER KNOWLEDGE ===");
    longTerm.forEach((m) => {
      parts.push(`- [${m.memory_type}] ${m.content}`);
    });
  }

  if (shortTerm) {
    parts.push("\n=== RECENT CONVERSATION ===");
    parts.push(shortTerm);
  }

  return parts.join("\n");
};

// ── Utilities ────────────────────────────────────────────────────────

async function computeMemoryEmbedding(text) {
  try {
    const emb = await getCachedEmbedding(text);
    // getCachedEmbedding now returns null on Ollama failure — no fake vectors
    if (emb && Array.isArray(emb) && emb.length > 0) return emb;
  } catch (err) {
    console.error(`[Memory] Embedding failed:`, err.message);
  }
  // Return null — callers handle gracefully
  return null;
}

function cosineSim(a, b) {
  if (!a || !b || a.length !== b.length) return 0;
  let dot = 0, nA = 0, nB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    nA += a[i] * a[i];
    nB += b[i] * b[i];
  }
  return nA && nB ? dot / (Math.sqrt(nA) * Math.sqrt(nB)) : 0;
}

function extractKeywordsSimple(text) {
  const stopWords = new Set([
    "the","a","an","is","are","was","were","in","on","at","to","for","of",
    "and","or","but","i","my","me","we","you","he","she","it","they","do",
    "does","did","have","has","had","am","be","been","being","this","that",
    "these","those","with","from","by","as","at","so","no","not","if","or",
  ]);
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w))
    .slice(0, 8);
}
