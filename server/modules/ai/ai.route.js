import express from "express";
import * as aiController from "./ai.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";

// RBAC: admin / branch_admin manage AI features.
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);

router.post("/summaries", checkRole(...ADMIN), aiController.createConversationSummary);
router.get("/summaries", checkRole(...ADMIN), aiController.getConversationSummaries);
router.get("/summaries/:chatId", checkRole(...ADMIN), aiController.getConversationSummary);

router.post("/feedback", checkRole(...ADMIN), aiController.createAIFeedback);
router.get("/feedback/stats", checkRole(...ADMIN), aiController.getAIFeedbackStats);
router.get("/feedback/chat/:chatId", checkRole(...ADMIN), aiController.getFeedbackByChat);

router.post("/usage", checkRole(...ADMIN), aiController.recordAIUsage);
router.get("/usage", checkRole(...ADMIN), aiController.getAIUsageReport);

router.post("/jobs", checkRole(...ADMIN), aiController.enqueueJob);
router.get("/jobs/stats", checkRole(...ADMIN), aiController.getJobStats);

export const aiRouter = router;
export default router;