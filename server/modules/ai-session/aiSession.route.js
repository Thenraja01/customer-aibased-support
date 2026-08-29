import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";
import * as sessionController from "./aiSession.controller.js";

const router = express.Router();

router.use(protect);
router.use(attachScope);

// Stats
router.get("/stats", sessionController.getStats);

// Conversations CRUD
router.get("/conversations", sessionController.getConversations);
router.post("/conversations", sessionController.createConversation);
router.get("/conversations/:id/messages", sessionController.getMessages);
router.patch("/conversations/:id", sessionController.updateConversation);
router.delete("/conversations/:id", sessionController.deleteConversation);

// Feedback
router.post("/messages/:id/feedback", sessionController.setFeedback);

// Action Confirmations
router.post("/actions/:id/confirm", sessionController.confirmAction);
router.post("/actions/:id/cancel", sessionController.cancelAction);

// SSE Token Streaming Gateway
router.post("/stream", sessionController.streamAI);

export default router;