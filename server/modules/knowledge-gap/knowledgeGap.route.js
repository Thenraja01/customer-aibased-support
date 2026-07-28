import express from "express";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import * as knowledgeGapController from "./knowledgeGap.controller.js";

const router = express.Router();

router.use(protect);

router.get("/stats", restrict("super admin", "admin"), knowledgeGapController.getGapStats);
router.get("/", restrict("super admin", "admin"), knowledgeGapController.getKnowledgeGaps);
router.get("/suggested-topics", restrict("super admin", "admin"), knowledgeGapController.getSuggestedTopics);
router.patch("/:id/status", restrict("super admin", "admin"), knowledgeGapController.updateGapStatus);
router.patch("/:id/resolve", restrict("super admin", "admin"), knowledgeGapController.resolveGap);
router.patch("/:id/dismiss", restrict("super admin", "admin"), knowledgeGapController.dismissGap);
router.delete("/:id", restrict("super admin", "admin"), knowledgeGapController.deleteGap);

export default router;