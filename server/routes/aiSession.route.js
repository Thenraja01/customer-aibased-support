import express from "express";
import {
  create,
  getAll,
  getStats,
  getById,
  getByChat,
  getChatTokens,
  removeByChat,
} from "../controller/aiSession.controller.js";
import { protect, restrict } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "agent"), create);
router.get("/", restrict("admin"), getAll);
router.get("/stats", restrict("admin"), getStats);
router.get("/:id", restrict("admin", "agent"), getById);
router.get("/chat/:chatId", restrict("admin", "agent"), getByChat);
router.get("/chat/:chatId/tokens", restrict("admin"), getChatTokens);
router.delete("/chat/:chatId", restrict("admin"), removeByChat);

export default router;
