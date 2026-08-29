import express from "express";
import {
  getWidgetConfig,
  startConversation,
  getConversationHistory,
  sendWidgetMessage,
  escalateWidgetChat,
  getWidgetMessages,
  initWidget,
  streamWidgetChat,
  uploadWidgetFile,
} from "./widget.controller.js";
import { uploadToCloud, handleUpload } from "../../middleware/upload.middleware.js";

const router = express.Router();

// Handshake & Init (/api/v1/widget/init)
router.all("/widget/init", initWidget);
router.get("/config", getWidgetConfig);

// SSE Streaming & Messages
router.post("/chat/stream", streamWidgetChat);
router.post("/chat/message", sendWidgetMessage);
router.get("/chat/messages", getWidgetMessages);
router.post("/chat/escalate", escalateWidgetChat);

// File Upload
router.post("/chat/upload", handleUpload(uploadToCloud), uploadWidgetFile);

// Legacy Conversations
router.post("/conversations", startConversation);
router.get("/conversations/:id", getConversationHistory);

export default router;

