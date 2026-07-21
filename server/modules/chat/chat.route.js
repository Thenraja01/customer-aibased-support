import express from "express";
import * as chatController from "./chat.controller.js";
import { protect, restrict, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createChatSchema, updateTopicSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(createChatSchema), chatController.createNewChat);
router.post("/ai", chatController.processAI);
router.get("/", restrict("super admin", "tenant admin", "admin", "agent"), chatController.getChats);
router.get("/active", restrict("super admin", "tenant admin", "admin", "agent"), chatController.getActive);
router.get("/search", restrict("super admin", "tenant admin", "admin", "agent"), chatController.search);
router.get("/user/:userId", selfOrAdminParam("userId"), chatController.getChatsByUserId);
router.get("/user/:userId/count", selfOrAdminParam("userId"), chatController.getUserChatCount);
router.get("/:id", chatController.getChat);
router.patch("/:id/topic", selfOrAdmin, validate(updateTopicSchema), chatController.updateTopic);
router.patch("/:id/close", selfOrAdmin, chatController.close);
router.patch("/:id/reopen", selfOrAdmin, chatController.reopen);
router.delete("/:id", selfOrAdmin, chatController.removeChat);

export default router;
