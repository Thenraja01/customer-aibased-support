import express from "express";
import {
  createNewChat,
  getChats,
  getActive,
  search,
  getChat,
  getChatsByUserId,
  getUserChatCount,
  updateTopic,
  close,
  reopen,
  removeChat,
} from "../controller/chat.controller.js";
import { protect, restrict, selfOrAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", createNewChat);
router.get("/", restrict("admin", "agent"), getChats);
router.get("/active", restrict("admin", "agent"), getActive);
router.get("/search", restrict("admin", "agent"), search);
router.get("/:id", getChat); // Needs fine-grained access control in controller later based on participant
router.get("/user/:userId", selfOrAdmin, getChatsByUserId);
router.get("/user/:userId/count", selfOrAdmin, getUserChatCount);
router.patch("/:id/topic", updateTopic);
router.patch("/:id/close", close);
router.patch("/:id/reopen", reopen);
router.delete("/:id", restrict("admin"), removeChat);

export default router;
