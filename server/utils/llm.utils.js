import Groq from "groq-sdk";
import env from "../config/env.js";

let groqClient = null;

const getClient = () => {
  if (!groqClient && env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: env.GROQ_API_KEY });
  }
  return groqClient;
};

export const chatCompletion = async ({ messages, model, temperature = 0.7, maxTokens = 1024 }) => {
  const client = getClient();
  if (!client) throw new Error("Groq API key not configured");

  const response = await client.chat.completions.create({
    model: model || env.LLM.CHAT_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
  });

  return {
    content: response.choices[0]?.message?.content || "",
    model: response.model,
    usage: {
      prompt_tokens: response.usage?.prompt_tokens || 0,
      completion_tokens: response.usage?.completion_tokens || 0,
      total_tokens: response.usage?.total_tokens || 0,
    },
  };
};

export const generateEmbedding = async (text) => {
  const client = getClient();
  if (!client) {
    return computeLocalEmbedding(text);
  }

  try {
    const response = await client.embeddings.create({
      model: env.LLM.EMBED_MODEL || "nomic-embed-text-v1.5",
      input: text,
    });
    return response.data[0]?.embedding || computeLocalEmbedding(text);
  } catch {
    return computeLocalEmbedding(text);
  }
};

export const generateBatchEmbeddings = async (texts) => {
  const client = getClient();
  if (!client) {
    return texts.map((t) => computeLocalEmbedding(t));
  }

  try {
    const response = await client.embeddings.create({
      model: env.LLM.EMBED_MODEL || "nomic-embed-text-v1.5",
      input: texts,
    });
    return response.data.map((d) => d.embedding);
  } catch {
    return texts.map((t) => computeLocalEmbedding(t));
  }
};

function computeLocalEmbedding(text) {
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

export const extractEntitiesFromText = async (text) => {
  const client = getClient();
  if (!client) return extractEntitiesLocal(text);

  const truncated = text.substring(0, 3000);

  try {
    const response = await chatCompletion({
      messages: [
        {
          role: "system",
          content: `Extract entities and relationships from the text. Return ONLY valid JSON array of objects with "entity_name", "entity_type", "relationships" array of {target, relationship, weight}. Entity types: Person, Organization, Product, Policy, Process, Concept, Document, Role, System, Metric. Return at most 15 entities.`,
        },
        { role: "user", content: truncated },
      ],
      temperature: 0.1,
      maxTokens: 1500,
    });

    const match = response.content.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {
    // fall through to local
  }

  return extractEntitiesLocal(text);
};

function extractEntitiesLocal(text) {
  const entities = [];
  const sentences = text.split(/[.!?\n]+/).filter((s) => s.trim().length > 10);
  const wordCounts = {};

  sentences.forEach((s) => {
    const words = s.trim().split(/\s+/);
    words.forEach((w) => {
      if (w.length > 3) {
        wordCounts[w.toLowerCase()] = (wordCounts[w.toLowerCase()] || 0) + 1;
      }
    });
  });

  const sorted = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  sorted.forEach(([word, count]) => {
    entities.push({
      entity_name: word,
      entity_type: "Concept",
      relationships: [],
      weight: Math.min(count / 3, 1),
    });
  });

  return entities;
}

export const isLLMConfigured = () => {
  return !!env.GROQ_API_KEY;
};
