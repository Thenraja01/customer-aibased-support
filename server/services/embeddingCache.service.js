import { getEmbedding, getEmbeddingDim } from "./embedding.service.js";
import { getCache } from "../config/redis.js";
import crypto from "crypto";

const CACHE_PREFIX = "emb:";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 h

const hashText = (text) => crypto.createHash("sha1").update(text).digest("hex");

const normalizeText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text.trim().toLowerCase().replace(/\s+/g, " ");
};

/**
 * Get embedding with Redis cache.
 * Returns null if Ollama is down — never a fake fallback vector.
 */
export const getCachedEmbedding = async (text) => {
  // Guard: invalid input → return null, do NOT call Ollama with garbage
  if (!text || typeof text !== "string") {
    return null;
  }

  const normalized = normalizeText(text);
  if (normalized.length === 0) {
    return null;
  }

  const key = `${CACHE_PREFIX}${hashText(normalized)}`;
  const cache = getCache();

  // Try cache first
  try {
    const cached = await cache.get(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Cache miss or parse error — fall through to Ollama
  }

  // Generate from Ollama
  const embedding = await getEmbedding(text);

  // Only cache valid non-null embeddings
  if (embedding && Array.isArray(embedding) && embedding.length > 0) {
    try {
      await cache.set(key, JSON.stringify(embedding), CACHE_TTL_MS);
    } catch {
      // Cache write failure is non-fatal
    }
  }

  // Return null if Ollama failed — callers must handle null
  return embedding ?? null;
};

/**
 * Batch embedding with per-item cache checks.
 * Uses sequential Ollama calls for uncached items (avoids overload).
 */
export const getCachedEmbeddingBatch = async (texts) => {
  const cache = getCache();
  const results = new Array(texts.length).fill(null);
  const uncachedIndices = [];

  // First pass: check cache
  await Promise.all(
    texts.map(async (text, i) => {
      const normalized = normalizeText(text);
      if (!normalized) return; // leave null

      const key = `${CACHE_PREFIX}${hashText(normalized)}`;
      try {
        const cached = await cache.get(key);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            results[i] = parsed;
            return;
          }
        }
      } catch { /* ignore */ }

      uncachedIndices.push(i);
    })
  );

  // Second pass: generate missing embeddings sequentially
  for (const i of uncachedIndices) {
    const emb = await getEmbedding(texts[i]);
    results[i] = emb ?? null; // null if Ollama failed

    if (emb && Array.isArray(emb) && emb.length > 0) {
      const key = `${CACHE_PREFIX}${hashText(normalizeText(texts[i]))}`;
      try {
        await cache.set(key, JSON.stringify(emb), CACHE_TTL_MS);
      } catch { /* non-fatal */ }
    }
  }

  return results;
};

export const invalidateEmbeddingCache = async (text) => {
  const normalized = normalizeText(text);
  if (!normalized) return 0;
  const key = `${CACHE_PREFIX}${hashText(normalized)}`;
  return await getCache().del(key);
};

export { getEmbeddingDim };
