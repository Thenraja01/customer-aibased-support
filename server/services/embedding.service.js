const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "nomic-embed-text";
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM) || 768;
const FETCH_TIMEOUT_MS = 30_000;

let modelReady = false;
let warmupInProgress = false;
let lastError = null;

export const getEmbeddingDim = () => EMBEDDING_DIM;
export const isModelReady = () => modelReady;
export const getLastError = () => lastError;

// Abort-controller helper for fetch timeout
const fetchWithTimeout = async (url, options, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
};

export const healthCheck = async () => {
  try {
    const res = await fetchWithTimeout(`${OLLAMA_BASE_URL}/api/tags`, {}, 10_000);
    if (!res.ok) { modelReady = false; return false; }
    const data = await res.json();
    modelReady = data.models?.some((m) => m.name.startsWith(EMBEDDING_MODEL.split(":")[0])) ?? false;
    if (!modelReady) lastError = `Model "${EMBEDDING_MODEL}" not found in Ollama`;
    return modelReady;
  } catch (err) {
    lastError = err.message;
    modelReady = false;
    return false;
  }
};

const pullModel = async () => {
  console.log(`[OllamaEmbedding] Pulling model "${EMBEDDING_MODEL}"…`);
  const res = await fetchWithTimeout(
    `${OLLAMA_BASE_URL}/api/pull`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: EMBEDDING_MODEL }),
    },
    5 * 60_000   // 5 min for a model pull
  );
  if (!res.ok) throw new Error(`Pull failed: ${res.statusText}`);
  // Ollama streams progress lines; consume them
  await res.text();
  modelReady = true;
  lastError = null;
  console.log(`[OllamaEmbedding] Model "${EMBEDDING_MODEL}" ready.`);
};

/**
 * Warm-up: called once at server startup.
 * Runs in background — does NOT block startup.
 */
export const warmupEmbeddingModel = async () => {
  if (modelReady || warmupInProgress) return;
  warmupInProgress = true;
  try {
    const ready = await healthCheck();
    if (!ready) await pullModel();
  } catch (err) {
    console.error("[OllamaEmbedding] Warm-up failed:", err.message);
    lastError = err.message;
  } finally {
    warmupInProgress = false;
  }
};const _queryEmbeddingCache = new Map();
const MAX_EMBED_CACHE_SIZE = 5000;

export const getEmbedding = async (text) => {
  if (!text || typeof text !== "string" || text.trim().length === 0) {
    return null;
  }

  const cacheKey = text.trim().toLowerCase();
  if (_queryEmbeddingCache.has(cacheKey)) {
    return _queryEmbeddingCache.get(cacheKey);
  }

  try {
    if (!modelReady) {
      const ready = await healthCheck();
      if (!ready) {
        console.warn("[OllamaEmbedding] Model not ready, skipping embedding.");
        return null;
      }
    }

    const res = await fetchWithTimeout(
      `${OLLAMA_BASE_URL}/api/embeddings`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
      }
    );

    if (!res.ok) throw new Error(`Ollama API error: ${res.status} ${res.statusText}`);

    const data = await res.json();
    if (!data.embedding || !Array.isArray(data.embedding) || data.embedding.length === 0) {
      throw new Error("Ollama returned empty or invalid embedding");
    }

    if (_queryEmbeddingCache.size >= MAX_EMBED_CACHE_SIZE) {
      const firstKey = _queryEmbeddingCache.keys().next().value;
      _queryEmbeddingCache.delete(firstKey);
    }
    _queryEmbeddingCache.set(cacheKey, data.embedding);

    return data.embedding;
  } catch (err) {
    console.error(`[OllamaEmbedding] Error:`, err.message);
    lastError = err.message;
    return null; 
  }
};

export const getEmbeddingBatch = async (texts, concurrency = 6) => {
  if (!Array.isArray(texts) || texts.length === 0) return [];

  const results = new Array(texts.length);
  let currentIndex = 0;

  // Worker pool for parallel processing with bounded concurrency
  const worker = async () => {
    while (currentIndex < texts.length) {
      const idx = currentIndex++;
      try {
        results[idx] = await getEmbedding(texts[idx]);
      } catch (err) {
        console.error(`[OllamaEmbedding] Batch item ${idx} failed:`, err.message);
        results[idx] = null;
      }
    }
  };

  const pool = Array.from({ length: Math.min(concurrency, texts.length) }, () => worker());
  await Promise.all(pool);

  return results;
};

export { EMBEDDING_MODEL, OLLAMA_BASE_URL };