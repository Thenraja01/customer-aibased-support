import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config();

export default {
  PORT: process.env.PORT || 3030,
  NODE_ENV: process.env.NODE_ENV || "development",

  RATE_LIMIT_WINDOW_MS: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  RATE_LIMIT_MAX_REQUESTS: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased for development

  MONGODB_URI: process.env.MONGODB_URI || "mongodb://localhost:27017/supportai",

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
  LLM_PROVIDER: process.env.LLM_PROVIDER || "ollama",
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GROQ_API_KEY: process.env.GROQ_API_KEY,
  LLM_MODEL: process.env.LLM_MODEL || "llama3.2:3b",
  OLLAMA_MODEL: process.env.OLLAMA_MODEL || process.env.LLM_MODEL || "llama3.2:3b",
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

  // JWT Configuration
  JWT_ISSUER: process.env.JWT_ISSUER || "supportai",
  JWT_AUDIENCE: process.env.JWT_AUDIENCE || "supportai-clients",
  ACCESS_TOKEN_TTL: process.env.ACCESS_TOKEN_TTL || "15m",
  REFRESH_TOKEN_TTL_DAYS: Number(process.env.REFRESH_TOKEN_TTL_DAYS) || 7,

  // OAuth Grant (for OAuth registration completion)
  OAUTH_GRANT_TTL_MINUTES: Number(process.env.OAUTH_GRANT_TTL_MINUTES) || 15,
  EMAIL_VERIFY_TTL_MINUTES: Number(process.env.EMAIL_VERIFY_TTL_MINUTES) || 30,

  // Redis
  REDIS_URL: process.env.REDIS_URL || "",

  // OAuth — Google
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "",
  GOOGLE_CALLBACK_URL: process.env.GOOGLE_CALLBACK_URL || "http://localhost:5173/oauth/google/callback",

  // OAuth — Facebook
  FACEBOOK_CLIENT_ID: process.env.FACEBOOK_CLIENT_ID || "",
  FACEBOOK_CLIENT_SECRET: process.env.FACEBOOK_CLIENT_SECRET || "",
  FACEBOOK_CALLBACK_URL: process.env.FACEBOOK_CALLBACK_URL || "http://localhost:5173/oauth/facebook/callback",
  FACEBOOK_GRAPH_VERSION: process.env.FACEBOOK_GRAPH_VERSION || "v18.0",

  // Super Admin
  SUPER_ADMIN_EMAIL: process.env.SUPER_ADMIN_EMAIL || "superadmin@supportai.com",
  SUPER_ADMIN_PASSWORD: process.env.SUPER_ADMIN_PASSWORD || "Super@123",
  SUPER_ADMIN_NAME: process.env.SUPER_ADMIN_NAME || "Super Admin",
  SUPER_ADMIN_ROLE: process.env.SUPER_ADMIN_ROLE || "super_admin",
  SUPER_ADMIN_ORG_ID: process.env.SUPER_ADMIN_ORG_ID || "",

  // Client / Frontend URLs
  CLIENT_URL: process.env.CLIENT_URL || process.env.FRONTEND_URL || "http://localhost:5173",
  FRONTEND_URL: process.env.FRONTEND_URL || "http://localhost:5173",

  // // Firebase Admin SDK — paste minified service-account JSON as a single-line string
  // FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT || "",
};