import ChatMemory from "./memory.schema.js";
import Message from "../message/message.schema.js";
import Chat from "../chat/chat.schema.js";
import { chunkHashMap, keywordIndexMap } from "../rag/hashmap.service.js";

// ── Short-Term Memory (In-Memory HashMap) ────────────────────────────
// Last N messages per chat, fast O(1) lookup by chat_id

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
  const embedding = computeMemoryEmbedding(content);

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
export const getRelevantMemories = async (userId, query, limit = 5) => {
  const queryEmbedding = computeMemoryEmbedding(query);

  const memories = await ChatMemory.find({
    user_id: userId,
    is_active: true,
    embedding: { $exists: true, $ne: [] },
  }).limit(50);

  if (memories.length === 0) return [];

  const scored = memories.map((m) => ({
    ...m.toObject(),
    relevance: cosineSim(queryEmbedding, m.embedding),
  }));

  return scored
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, limit)
    .map((m) => {
      m.access_count = (m.access_count || 0) + 1;
      m.last_accessed_at = new Date();
      m.save();
      return m;
    });
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

function computeMemoryEmbedding(text) {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const DIM = 128;
  const vec = new Array(DIM).fill(0);

  words.forEach((word, i) => {
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash + word.charCodeAt(j)) | 0;
    }
    const idx = Math.abs(hash % DIM);
    vec[idx] += 1 / (i + 1);
  });

  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag > 0) vec.forEach((_, i) => (vec[i] /= mag));

  return vec;
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
