import express from "express";
import {
  send,
  getByChat,
  getPaginated,
  getLatest,
  getCount,
  getAIOnly,
  search,
  remove,
  removeByChat,
} from "../controller/message.controller.js";
import { protect, restrict } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", send);
router.get("/chat/:chatId", getByChat);
router.get("/chat/:chatId/paginated", getPaginated);
router.get("/chat/:chatId/latest", getLatest);
router.get("/chat/:chatId/count", getCount);
router.get("/chat/:chatId/ai", getAIOnly);
router.get("/chat/:chatId/search", search);
router.delete("/:id", restrict("admin"), remove);
router.delete("/chat/:chatId/all", restrict("admin"), removeByChat);

export default router;
