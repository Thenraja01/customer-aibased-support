import express from "express";
import * as sessionController from "./aiSession.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", access("ai.summarize"), sessionController.create);
router.get("/", access("ai.summarize"), sessionController.getAll);
router.get("/stats", access("ai.train_kb"), sessionController.getStats);
router.get("/chat/:chatId", sessionController.getByChat);
router.get("/chat/:chatId/tokens", sessionController.getChatTokens);
router.get("/:id", sessionController.getById);
router.delete("/chat/:chatId", sessionController.removeByChat);

export default router;