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

  // LLM Configuration
  LLM_PROVIDER: process.env.LLM_PROVIDER || "gemini",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL || "gemini-2.0-flash",
  GROQ_MODEL: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  LLM_MIN_RAG_SCORE: Number(process.env.LLM_MIN_RAG_SCORE) || 0.35,
  LLM_MAX_CONV_CHARS: Number(process.env.LLM_MAX_CONV_CHARS) || 3000,
  LLM_TEMPERATURE: Number(process.env.LLM_TEMPERATURE) || 0.7,
  LLM_MAX_TOKENS: Number(process.env.LLM_MAX_TOKENS) || 2048,

  // RAG Configuration
  RAG: {
    CHUNK_SIZE: Number(process.env.RAG_CHUNK_SIZE) || 500,
    CHUNK_OVERLAP: Number(process.env.RAG_CHUNK_OVERLAP) || 100,
    EMBED_DIM: Number(process.env.EMBEDDING_DIM) || 256,
    BFS_MAX_DEPTH: Number(process.env.RAG_BFS_MAX_DEPTH) || 2,
    BFS_MAX_NODES: Number(process.env.RAG_BFS_MAX_NODES) || 30,
    TOP_K: Number(process.env.RAG_TOP_K) || 5,
    QUERY_CACHE_TTL_MS: Number(process.env.RAG_QUERY_CACHE_TTL_MS) || 600000,
  },

  // Embedding Configuration
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "nomic-embed-text",
  EMBEDDING_DIM: Number(process.env.EMBEDDING_DIM) || 768,
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL || "http://localhost:11434",

  // SMTP Configuration
  SMTP_HOST: process.env.SMTP_HOST || "smtp.gmail.com",
  SMTP_PORT: Number(process.env.SMTP_PORT) || 587,
  SMTP_USER: process.env.SMTP_USER || "",
  SMTP_PASS: process.env.SMTP_PASS || "",
  SMTP_FROM: process.env.SMTP_FROM || "SupportAI <noreply@supportai.com>",
  OTP_EXPIRY_MINUTES: Number(process.env.OTP_EXPIRY_MINUTES) || 10,

  // // Firebase Admin SDK — paste minified service-account JSON as a single-line string
  // FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT || "",
};