import express from "express";
import * as sessionController from "./aiSession.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";

// RBAC: admin / branch_admin manage AI sessions.
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);

router.post("/", checkRole(...ADMIN), sessionController.create);
router.get("/", checkRole(...ADMIN), sessionController.getAll);
router.get("/stats", checkRole(...ADMIN), sessionController.getStats);
router.get("/chat/:chatId", sessionController.getByChat);
router.get("/chat/:chatId/tokens", sessionController.getChatTokens);
router.get("/:id", sessionController.getById);
router.delete("/chat/:chatId", sessionController.removeByChat);

export default router;