import dotenv from "dotenv";
dotenv.config();

export default {
  PORT: process.env.PORT || 3030,
  NODE_ENV: process.env.NODE_ENV || "development",

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,

  MONGODB_URI: process.env.MONGODB_URI,

  // JWT
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // Cloudinary
  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },

  // Groq LLM
  GROQ_API_KEY: process.env.GROQ_API_KEY,

  LLM: {
    CHAT_MODEL: process.env.LLM_CHAT_MODEL || "llama3-70b-8192",
    EMBED_MODEL: process.env.LLM_EMBED_MODEL || "nomic-embed-text-v1.5",
    TEMPERATURE: Number(process.env.LLM_TEMPERATURE) || 0.7,
    MAX_TOKENS: Number(process.env.LLM_MAX_TOKENS) || 1024,
  },

  // RAG Configuration
  RAG: {
    CHUNK_SIZE: Number(process.env.RAG_CHUNK_SIZE) || 500,
    CHUNK_OVERLAP: Number(process.env.RAG_CHUNK_OVERLAP) || 100,
    EMBED_DIM: Number(process.env.RAG_EMBED_DIM) || 256,
    BFS_MAX_DEPTH: Number(process.env.RAG_BFS_MAX_DEPTH) || 2,
    BFS_MAX_NODES: Number(process.env.RAG_BFS_MAX_NODES) || 30,
    TOP_K: Number(process.env.RAG_TOP_K) || 5,
    QUERY_CACHE_TTL_MS: Number(process.env.RAG_QUERY_CACHE_TTL_MS) || 600000,
  },
};