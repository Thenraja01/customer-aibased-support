import express from "express";
import { protect, access } from "../../middleware/auth.middleware.js";
import * as knowledgeGapController from "./knowledgeGap.controller.js";

const router = express.Router();

router.use(protect);

router.get("/stats", access("ai.train_kb"), knowledgeGapController.getGapStats);
router.get("/", access("ai.train_kb"), knowledgeGapController.getKnowledgeGaps);
router.get("/suggested-topics", access("ai.train_kb"), knowledgeGapController.getSuggestedTopics);
router.patch("/:id/status", access("ai.train_kb"), knowledgeGapController.updateGapStatus);
router.patch("/:id/resolve", access("ai.train_kb"), knowledgeGapController.resolveGap);
router.patch("/:id/dismiss", access("ai.train_kb"), knowledgeGapController.dismissGap);
router.delete("/:id", access("ai.train_kb"), knowledgeGapController.deleteGap);

export default router;