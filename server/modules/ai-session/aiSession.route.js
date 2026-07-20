import express from "express";
import * as sessionController from "./aiSession.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "support"), sessionController.create);
router.get("/", restrict("admin", "support"), sessionController.getAll);
router.get("/stats", restrict("admin"), sessionController.getStats);
router.get("/chat/:chatId", sessionController.getByChat);
router.get("/chat/:chatId/tokens", sessionController.getChatTokens);
router.get("/:id", sessionController.getById);
router.delete("/chat/:chatId", sessionController.removeByChat);

export default router;
