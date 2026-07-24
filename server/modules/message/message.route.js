import express from "express";
import * as msgController from "./message.controller.js";
import { protect, selfOrAdmin, selfOrAdminByChatOwner } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { sendMessageSchema, updateMessageSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(sendMessageSchema), msgController.send);
router.get("/chat/:chatId", selfOrAdminByChatOwner("chatId"), msgController.getByChat);
router.get("/chat/:chatId/paginated", selfOrAdminByChatOwner("chatId"), msgController.getPaginated);
router.get("/chat/:chatId/latest", selfOrAdminByChatOwner("chatId"), msgController.getLatest);
router.get("/chat/:chatId/count", selfOrAdminByChatOwner("chatId"), msgController.getCount);
router.get("/chat/:chatId/ai", selfOrAdminByChatOwner("chatId"), msgController.getAIOnly);
router.get("/chat/:chatId/search", selfOrAdminByChatOwner("chatId"), msgController.search);
router.put("/:id", selfOrAdmin, validate(updateMessageSchema), msgController.update);
router.delete("/chat/:chatId/all", selfOrAdminByChatOwner("chatId"), msgController.removeByChat);
router.delete("/chat/:chatId", selfOrAdminByChatOwner("chatId"), msgController.removeByChat);
router.delete("/:id", selfOrAdmin, msgController.remove);

export default router;
