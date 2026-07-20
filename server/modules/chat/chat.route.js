import express from "express";
import * as chatController from "./chat.controller.js";
import { protect, restrict, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createChatSchema, updateTopicSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(createChatSchema), chatController.createNewChat);
router.post("/ai", chatController.processAI);
router.get("/", restrict("admin", "support"), chatController.getChats);
router.get("/active", restrict("admin", "support"), chatController.getActive);
router.get("/search", restrict("admin", "support"), chatController.search);
router.get("/user/:userId", selfOrAdminParam("userId"), chatController.getChatsByUserId);
router.get("/user/:userId/count", selfOrAdminParam("userId"), chatController.getUserChatCount);
router.get("/:id", chatController.getChat);
router.patch("/:id/topic", selfOrAdmin, validate(updateTopicSchema), chatController.updateTopic);
router.patch("/:id/close", selfOrAdmin, chatController.close);
router.patch("/:id/reopen", selfOrAdmin, chatController.reopen);
router.patch("/:id/assign", restrict("admin", "support"), chatController.assignAgentToChat);
router.patch("/:id/priority", restrict("admin", "support"), chatController.changePriority);
router.post("/:id/stream", chatController.streamChat);
router.post("/:id/escalate", chatController.escalateChat);
router.delete("/:id", selfOrAdmin, chatController.removeChat);

export default router;
