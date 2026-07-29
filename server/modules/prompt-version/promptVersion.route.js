import express from "express";
import { protect, access } from "../../middleware/auth.middleware.js";
import * as promptController from "./promptVersion.controller.js";

const router = express.Router();

router.use(protect);
router.use(access("ai.train_kb"));

router.get("/", promptController.getPrompt);
router.post("/draft", promptController.saveDraft);
router.post("/publish", promptController.publish);
router.post("/rollback/:version", promptController.rollback);
router.get("/history", promptController.getHistory);

export default router;