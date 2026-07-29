import express from "express";
import * as chatController from "./chat.controller.js";
import { protect, access, selfOrAdmin, selfOrAdminParam, selfOrAdminByChatOwner } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createChatSchema, updateTopicSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(createChatSchema), chatController.createNewChat);
router.post("/ai", chatController.processAI);
router.get("/", access("chat.view_history"), chatController.getChats);
router.get("/active", access("chat.view_history"), chatController.getActive);
router.get("/search", access("chat.view_history"), chatController.search);
router.get("/user/:userId", selfOrAdminParam("userId"), chatController.getChatsByUserId);
router.get("/user/:userId/count", selfOrAdminParam("userId"), chatController.getUserChatCount);
router.get("/:id", chatController.getChat);
router.patch("/:id/topic", selfOrAdmin, validate(updateTopicSchema), chatController.updateTopic);
router.patch("/close-all", access("chat.end"), chatController.closeAll);
router.patch("/:id/close", selfOrAdmin, chatController.close);
router.patch("/:id/reopen", selfOrAdmin, chatController.reopen);
router.delete("/:id", selfOrAdminByChatOwner("id"), chatController.removeChat);

export default router;