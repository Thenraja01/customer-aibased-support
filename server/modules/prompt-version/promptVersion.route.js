import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import * as promptController from "./promptVersion.controller.js";

// RBAC: admin / branch_admin manage prompt versions.
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);
router.use(checkRole(...ADMIN));

router.get("/", promptController.getPrompt);
router.post("/draft", promptController.saveDraft);
router.post("/publish", promptController.publish);
router.post("/rollback/:version", promptController.rollback);
router.get("/history", promptController.getHistory);

export default router;