import express from "express";
import * as aiController from "./ai.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/summaries", access("ai.summarize"), aiController.createConversationSummary);
router.get("/summaries", access("ai.summarize"), aiController.getConversationSummaries);
router.get("/summaries/:chatId", access("ai.summarize"), aiController.getConversationSummary);

router.post("/feedback", access("ai.summarize"), aiController.createAIFeedback);
router.get("/feedback/stats", access("ai.train_kb"), aiController.getAIFeedbackStats);
router.get("/feedback/chat/:chatId", access("ai.summarize"), aiController.getFeedbackByChat);

router.post("/usage", access("ai.train_kb"), aiController.recordAIUsage);
router.get("/usage", access("ai.train_kb"), aiController.getAIUsageReport);

router.post("/jobs", access("ai.train_kb"), aiController.enqueueJob);
router.get("/jobs/stats", access("ai.train_kb"), aiController.getJobStats);

export const aiRouter = router;
export default router;