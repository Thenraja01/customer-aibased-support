const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "nomic-embed-text";
const EMBEDDING_DIM = Number(process.env.EMBEDDING_DIM) || 768;

let modelReady = false;
let lastError = null;

export const getEmbeddingDim = () => EMBEDDING_DIM;

export const isModelReady = () => modelReady;

export const getLastError = () => lastError;

export const healthCheck = async () => {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!res.ok) return false;
    const data = await res.json();
    modelReady = data.models?.some((m) => m.name.startsWith(EMBEDDING_MODEL));
    if (!modelReady) lastError = `Model "${EMBEDDING_MODEL}" not found in Ollama`;
    return modelReady;
  } catch (err) {
    lastError = err.message;
    modelReady = false;
    return false;
  }
};

const pullModel = async () => {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: EMBEDDING_MODEL }),
    });
    if (!res.ok) throw new Error(`Pull failed: ${res.statusText}`);
    modelReady = true;
    lastError = null;
  } catch (err) {
    lastError = err.message;
    throw err;
  }
};

export const getEmbedding = async (text) => {
  try {
    if (!modelReady) await healthCheck();
    if (!modelReady) await pullModel();

    const res = await fetch(`${OLLAMA_BASE_URL}/api/embeddings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: EMBEDDING_MODEL, prompt: text }),
    });

    if (!res.ok) throw new Error(`Ollama API error: ${res.statusText}`);

    const data = await res.json();
    return data.embedding;
  } catch (err) {
    console.error(`[OllamaEmbedding] Error:`, err.message);
    lastError = err.message;
    return null;
  }
};

export const getEmbeddingBatch = async (texts) => {
  const results = await Promise.allSettled(texts.map((t) => getEmbedding(t)));
  return results.map((r) => (r.status === "fulfilled" ? r.value : null));
};

export { EMBEDDING_MODEL, OLLAMA_BASE_URL };