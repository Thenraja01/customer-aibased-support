import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import dbconnection from "./config/db.js";
import env from "./config/env.js";

import { notFound, errorHandler } from "./middleware/errorHandler.middleware.js";

import authRouter from "./routes/auth.route.js";
import userRouter from "./routes/user.route.js";
import chatRouter from "./routes/chat.route.js";
import messageRouter from "./routes/message.route.js";
import ticketRouter from "./routes/ticket.route.js";
import notificationRouter from "./routes/notification.route.js";
import documentRouter from "./routes/document.route.js";
import documentVerificationRouter from "./routes/documentVerification.route.js";
import organizationRouter from "./routes/organization.route.js";
import roleRouter from "./routes/role.route.js";
import documentTypeRouter from "./routes/documentType.route.js";
import aiSessionRouter from "./routes/aiSession.route.js";
import auditLogRouter from "./routes/auditLog.route.js";
import faqRouter from "./routes/faq.route.js";

const app = express();


app.use(helmet()); 

app.use(
  cors({
    origin: env.NODE_ENV === "production" ? process.env.CLIENT_URL : "*",
    credentials: true,
  })
);

// ── Global Rate Limiter ───────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(globalLimiter);

// ── Auth-specific stricter rate limiter ──────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again in 15 minutes.",
  },
});

// ── Body Parsers ──────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── API Routes ────────────────────────────────────────────────────────
app.use("/auth", authLimiter, authRouter);
app.use("/users", userRouter);
app.use("/chats", chatRouter);
app.use("/messages", messageRouter);
app.use("/tickets", ticketRouter);
app.use("/notifications", notificationRouter);
app.use("/documents", documentRouter);
app.use("/document-verifications", documentVerificationRouter);
app.use("/organizations", organizationRouter);
app.use("/roles", roleRouter);
app.use("/document-types", documentTypeRouter);
app.use("/ai-sessions", aiSessionRouter);
app.use("/audit-logs", auditLogRouter);
app.use("/faqs", faqRouter);

// ── Health Check ──────────────────────────────────────────────────────
app.get("/api/health/v1", (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    success: dbReady,
    message: dbReady
      ? "Server is healthy"
      : "Database not connected — start MongoDB on localhost:27017",
    mongo: dbReady ? "connected" : "disconnected",
    environment: env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// ── 404 & Global Error Handlers (must be LAST) ─────────────────────
app.use(notFound);
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────
const port = env.PORT;

const startServer = async () => {
  try {
    await dbconnection();
    app.listen(port, () => {
      console.log(`🚀 Server running on port ${port} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
