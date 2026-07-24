import express from "express";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import * as promptController from "./promptVersion.controller.js";

const router = express.Router();

router.use(protect);

router.get("/", restrict("super admin", "admin"), promptController.getPrompt);
router.post("/draft", restrict("super admin", "admin"), promptController.saveDraft);
router.post("/publish", restrict("super admin", "admin"), promptController.publish);
router.post("/rollback/:version", restrict("super admin", "admin"), promptController.rollback);
router.get("/history", restrict("super admin", "admin"), promptController.getHistory);

export default router;
