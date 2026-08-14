import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import * as knowledgeGapController from "./knowledgeGap.controller.js";

// RBAC: admin / branch_admin manage knowledge gaps.
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);

router.get("/stats", checkRole(...ADMIN), knowledgeGapController.getGapStats);
router.get("/", checkRole(...ADMIN), knowledgeGapController.getKnowledgeGaps);
router.get("/suggested-topics", checkRole(...ADMIN), knowledgeGapController.getSuggestedTopics);
router.get("/:id", checkRole(...ADMIN), knowledgeGapController.getGapById);
router.get("/:id/suggested-knowledge", checkRole(...ADMIN), knowledgeGapController.getSuggestedKnowledge);
router.get("/:id/similar", checkRole(...ADMIN), knowledgeGapController.getSimilarGaps);
router.post("/:id/resolve/faq", checkRole(...ADMIN), knowledgeGapController.resolveWithFaq);
router.post("/:id/resolve/document", checkRole(...ADMIN), knowledgeGapController.resolveWithDocument);
router.post("/:id/resolve/link", checkRole(...ADMIN), knowledgeGapController.resolveWithLink);
router.post("/:id/retest", checkRole(...ADMIN), knowledgeGapController.retestGap);
router.patch("/:id/status", checkRole(...ADMIN), knowledgeGapController.updateGapStatus);
router.patch("/:id/resolve", checkRole(...ADMIN), knowledgeGapController.resolveGap);
router.patch("/:id/dismiss", checkRole(...ADMIN), knowledgeGapController.dismissGap);
router.delete("/:id", checkRole(...ADMIN), knowledgeGapController.deleteGap);

export default router;