import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import path from "path";

import dbconnection from "./config/db.js";
import env from "./config/env.js";
import { initSocket } from "./config/socket.js";

import { notFound, errorHandler } from "./middleware/errorHandler.middleware.js";

import { authRouter } from "./modules/auth/index.js";
import { userRouter } from "./modules/user/index.js";
import { chatRouter } from "./modules/chat/index.js";
import { messageRouter } from "./modules/message/index.js";
import { ticketRouter, ticketTemplateRouter } from "./modules/ticket/index.js";
import { notificationRouter } from "./modules/notification/index.js";
import { documentRouter } from "./modules/document/index.js";
import { documentVerificationRouter } from "./modules/document-verification/index.js";
import { organizationRouter } from "./modules/organization/index.js";
import { roleRouter } from "./modules/role/index.js";
import { documentTypeRouter } from "./modules/document-type/index.js";
import { aiSessionRouter } from "./modules/ai-session/index.js";
import { auditLogRouter } from "./modules/audit-log/index.js";
import { faqRouter } from "./modules/faq/index.js";
import { ragRouter } from "./modules/rag/index.js";
import { memoryRouter } from "./modules/memory/index.js";
import { adminRouter } from "./modules/admin/index.js";
import { searchRouter } from "./modules/search/index.js";
import { promptVersionRouter } from "./modules/prompt-version/index.js";
import { knowledgeGapRouter } from "./modules/knowledge-gap/index.js";
import { archiveExpiredMemories } from "./modules/memory/memory.service.js";
import { initFirebase } from "./config/firebase.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(
  cors({
    origin: ["http://localhost:5173", process.env.CLIENT_URL].filter(Boolean),
    credentials: true,
  })
);

app.use("/uploads", express.static(path.resolve("uploads")));

const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === "development" ? 500 : env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests, please try again later.",
  },
});
app.use(globalLimiter);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === "development" ? 200 : 20,
  message: {
    success: false,
    message: "Too many authentication attempts, please try again in 15 minutes.",
  },
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/auth", authLimiter, authRouter);
app.use("/users", userRouter);
app.use("/chats", chatRouter);
app.use("/messages", messageRouter);
app.use("/tickets", ticketRouter);
app.use("/ticket-templates", ticketTemplateRouter);
app.use("/notifications", notificationRouter);
app.use("/documents", documentRouter);
app.use("/document-verifications", documentVerificationRouter);
app.use("/organizations", organizationRouter);
app.use("/roles", roleRouter);
app.use("/document-types", documentTypeRouter);
app.use("/ai-sessions", aiSessionRouter);
app.use("/audit-logs", auditLogRouter);
app.use("/faqs", faqRouter);
app.use("/rag", ragRouter);
app.use("/memory", memoryRouter);
app.use("/knowledge-gaps", knowledgeGapRouter);
app.use("/admin/v1", adminRouter);
app.use("/search/v1", searchRouter);
app.use("/admin/v1/prompt", promptVersionRouter);

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

app.use(notFound);
app.use(errorHandler);

const port = env.PORT;

const startServer = async () => {
  try {
    await dbconnection();

    // Initialize Firebase Admin SDK once after DB is ready
    initFirebase();

    setInterval(() => {
      archiveExpiredMemories().catch((err) =>
        console.error("[Memory Archiver] Error:", err.message)
      );
    }, 60 * 60 * 1000);

    const httpServer = createServer(app);
    initSocket(httpServer);

    httpServer.listen(port, () => {
      console.log(`Server running on port ${port} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
