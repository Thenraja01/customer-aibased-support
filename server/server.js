import express from "express";
import { createServer } from "http";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import path from "path";

import dbconnection from "./config/db.js";
import env from "./config/env.js";
import { initSocket } from "./config/socket.js";
import { allowedOrigins } from "./config/cors.js";

import { notFound, errorHandler } from "./middleware/errorHandler.middleware.js";

import { authRouter } from "./modules/auth/index.js";
import { userRouter } from "./modules/user/index.js";
import { chatRouter, publicRouter } from "./modules/chat/index.js";
import { messageRouter } from "./modules/message/index.js";
import { ticketRouter, ticketTemplateRouter } from "./modules/ticket/index.js";
import { notificationRouter } from "./modules/notification/index.js";
import { documentRouter } from "./modules/document/index.js";
import { documentVerificationRouter } from "./modules/document-verification/index.js";
import { organizationRouter } from "./modules/organization/index.js";
import { branchRouter } from "./modules/branch/index.js";
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
import { aiRouter } from "./modules/ai/index.js";
import { communicationRouter } from "./modules/communication/index.js";
import { feedbackRouter } from "./modules/feedback/index.js";
import { superAdminRouter } from "./modules/super-admin/index.js";
import { documentApprovalRouter } from "./modules/document-approval/index.js";
import { agentRoutes } from "./modules/agent/index.js";
import graphRouter from "./modules/graph/graph.route.js";
import { knowledgeRouter } from "./modules/knowledge/index.js";
import { topicRouter } from "./modules/topic/index.js";
import widgetRouter from "./modules/widget/widget.route.js";
import { apiKeyRouter } from "./modules/api-key/index.js";
import { archiveExpiredMemories } from "./modules/memory/memory.service.js";
import { initFirebase } from "./config/firebase.js";
import { initRedis } from "./config/redis.js";
import { chromaService } from "./config/chroma.js";
import { warmupEmbeddingModel } from "./services/embedding.service.js";
import { runDocumentStatusMigration } from "./utils/migration.utils.js";
import { startWorker } from "./modules/ai/worker.js";

process.on("uncaughtException", (err) => {
  console.error("[UncaughtException]", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[UnhandledRejection]", reason);
});

const app = express();

app.use(helmet({ 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
  xFrameOptions: false
}));

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use("/uploads", express.static(path.resolve("uploads")));
app.use(express.static(path.resolve("../public")));
app.use(express.static(path.resolve("public")));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Global sanitizer: Convert empty string IDs from frontend to null to prevent MongoDB Cast errors
app.use((req, res, next) => {
  if (req.body && typeof req.body === "object") {
    ["branch_id", "organization_id", "role_id", "assigned_to"].forEach((field) => {
      if (req.body[field] === "") {
        req.body[field] = null;
      }
    });
  }
  if (req.query && typeof req.query === "object") {
    ["branch_id", "organization_id", "role_id", "assigned_to"].forEach((field) => {
      if (req.query[field] === "") {
        req.query[field] = null;
      }
    });
  }
  next();
});

app.use("/auth", authRouter);
app.use("/users", userRouter);
app.use("/chats", chatRouter);
app.use("/public/chats", publicRouter);
app.use("/messages", messageRouter);
app.use("/tickets", ticketRouter);
app.use("/ticket-templates", ticketTemplateRouter);
app.use("/notifications", notificationRouter);
app.use("/documents", documentRouter);
app.use("/document-verifications", documentVerificationRouter);
app.use("/organizations", organizationRouter);
app.use("/branches", branchRouter);
app.use("/document-types", documentTypeRouter);
app.use("/ai-sessions", aiSessionRouter);
app.use("/api/ai", aiSessionRouter);
app.use("/audit-logs", auditLogRouter);
app.use("/faqs", faqRouter);
app.use("/rag", ragRouter);
app.use("/memory", memoryRouter);
app.use("/knowledge-gaps", knowledgeGapRouter);
app.use("/knowledge-graph", graphRouter);
app.use("/knowledge-nodes", knowledgeRouter);
app.use("/topics", topicRouter);
app.use("/admin/v1", adminRouter);
app.use("/search/v1", searchRouter);
app.use("/admin/v1/prompt", promptVersionRouter);
app.use("/ai", aiRouter);
app.use("/communication", communicationRouter);
app.use("/communications", communicationRouter);
app.use("/feedback", feedbackRouter);
app.use("/agent", agentRoutes);
app.use("/api/v1/api-keys", apiKeyRouter);
app.use("/api-keys", apiKeyRouter);
app.use("/api/v1", widgetRouter);
app.use("/api/v1/feedback", feedbackRouter);
app.use("/widget", widgetRouter);

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

    // Run database migrations for legacy document statuses and roles
    await runDocumentStatusMigration();

    // Initialize Chroma DB for Vector Search
    await chromaService.init();

    // Initialize Redis cache layer
    await initRedis();

    // Initialize Firebase Admin SDK once after DB is ready
    initFirebase();

    // Warm up Ollama embedding model in background (non-blocking)
    if (process.env.OLLAMA_WARMUP_ON_START !== "false") {
      warmupEmbeddingModel().catch((err) =>
        console.warn("[Startup] Embedding model warmup error:", err.message)
      );
    }

    // Start Background Job Worker
    startWorker();

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

