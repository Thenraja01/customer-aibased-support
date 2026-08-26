/**
 * Prompt/Response Cache Service
 *
 * Caches full LLM responses keyed by a hash of:
 *   orgId + roleFilter + normalized_query
 *
 * Uses Redis when available, in-memory MemoryCache as fallback.
 * TTL defaults to RAG_QUERY_CACHE_TTL_MS (env), default 10 min.
 *
 * Cache is invalidated per-org when documents are approved/deleted.
 */

import crypto from "crypto";
import { getCache } from "../config/redis.js";

const CACHE_PREFIX = "rcache:";
const DEFAULT_TTL_MS = Number(process.env.RESPONSE_CACHE_TTL_MS) || 10 * 60 * 1000; // 10 min

// ── Key generation ───────────────────────────────────────────────────

const normalizeQuery = (q) => {
  if (!q || typeof q !== "string") return "";
  return q.trim().toLowerCase().replace(/\s+/g, " ");
};

const buildCacheKey = (organizationId, roleFilter, query) => {
  const normalized = normalizeQuery(query);
  const roleStr = roleFilter ? JSON.stringify(roleFilter) : "null";
  const raw = `${organizationId || "anon"}:${roleStr}:${normalized}`;
  const hash = crypto.createHash("sha1").update(raw).digest("hex");
  return `${CACHE_PREFIX}${hash}`;
};

export const getResponseCache = async (organizationId, roleFilter, query) => {
  if (!query) return null;

  const key = buildCacheKey(organizationId, roleFilter, query);
  const cache = getCache();

  try {
    const raw = await cache.get(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    console.log(`[ResponseCache] HIT key=${key.slice(0, 24)}…`);
    return parsed;
  } catch {
    return null;
  }
};

export const setResponseCache = async (
  organizationId,
  roleFilter,
  query,
  responseData,
  ttlMs = DEFAULT_TTL_MS
) => {
  if (!query || !responseData?.text) return;

  // Don't cache low-confidence responses (they're potentially wrong)
  if (responseData.responseMode === "no_confidence") {
    console.log("[ResponseCache] Skip cache: low confidence response");
    return;
  }

  const key = buildCacheKey(organizationId, roleFilter, query);
  const cache = getCache();

  try {
    const payload = JSON.stringify({
      ...responseData,
      cachedAt: new Date().toISOString(),
    });
    await cache.set(key, payload, ttlMs);
    console.log(`[ResponseCache] SET key=${key.slice(0, 24)}… ttl=${ttlMs}ms`);
  } catch (err) {
    console.warn("[ResponseCache] Write failed (non-fatal):", err.message);
  }
};

export const invalidateOrgResponseCache = async (organizationId) => {
  if (!organizationId) return;
  const cache = getCache();

  try {
    // We use a wildcard key scan — only works efficiently with Redis.
    // Falls back gracefully for MemoryCache.
    const pattern = `${CACHE_PREFIX}*`;
    const allKeys = await cache.keys(pattern);

    // We can't reverse-lookup org from hash, so we track org keys separately
    // OR we just clear all response cache (conservative but safe for small caches)
    // For production at scale: use org-prefix key pattern instead
    let deleted = 0;
    for (const k of allKeys) {
      await cache.del(k);
      deleted++;
    }
    console.log(`[ResponseCache] Invalidated ${deleted} keys for org ${organizationId}`);
  } catch (err) {
    console.warn("[ResponseCache] Invalidation failed (non-fatal):", err.message);
  }
};

export default {
  getResponseCache,
  setResponseCache,
  invalidateOrgResponseCache,
  buildCacheKey,
};
