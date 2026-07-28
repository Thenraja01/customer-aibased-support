const STOP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "in", "on", "at", "to", "for",
  "of", "and", "or", "but", "i", "my", "me", "we", "you", "he", "she", "it",
  "they", "do", "does", "did", "have", "has", "had", "am", "be", "been", "being",
  "this", "that", "these", "those", "with", "from", "by", "as", "so", "no",
  "not", "if",
]);

export const extractKeywords = (text, maxKeywords = Infinity) => {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  return maxKeywords < Infinity ? words.slice(0, maxKeywords) : words;
};

export const cosineSimilarity = (a, b) => {
  if (!a || !b || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
};

export const computeEmbedding = async (text, dim = 128) => {
  try {
    const { getEmbedding } = await import("../services/embedding.service.js");
    const emb = await getEmbedding(text);
    if (emb) return emb;
  } catch (err) {
    console.error(`[AI Utils] Ollama embedding failed, using fallback:`, err.message);
  }
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 2);

  const vec = new Array(dim).fill(0);
  words.forEach((word, i) => {
    let hash = 0;
    for (let j = 0; j < word.length; j++) {
      hash = ((hash << 5) - hash + word.charCodeAt(j)) | 0;
    }
    const idx = Math.abs(hash % dim);
    vec[idx] += 1 / (i + 1);
  });

  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0));
  if (mag > 0) vec.forEach((_, i) => (vec[i] /= mag));
  return vec;
};
