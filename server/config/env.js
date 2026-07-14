import dotenv from "dotenv";
dotenv.config()

export default {
  PORT: process.env.PORT || 3060,

  NODE_ENV: process.env.NODE_ENV || "development",
  RATE_LIMIT_WINDOW_MS:process.env.RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_MAX_REQUESTS:process.env.RATE_LIMIT_MAX_REQUESTS,
  MAX_AI_TOKENS:process.env.MAX_AI_TOKENS,
  AI_REQUEST_TIMEOUT_MS:process.env.AI_REQUEST_TIMEOUT_MS,
  MONGODB_URI: process.env.MONGODB_URI,

  JWT_SECRET: process.env.JWT_SECRET,

  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  CLOUDINARY: {
    CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    API_KEY: process.env.CLOUDINARY_API_KEY,
    API_SECRET: process.env.CLOUDINARY_API_SECRET,
  },
};