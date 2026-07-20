import express from "express";
import * as msgController from "./message.controller.js";
import { protect, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { sendMessageSchema, updateMessageSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(sendMessageSchema), msgController.send);
router.get("/chat/:chatId", selfOrAdminParam("chatId"), msgController.getByChat);
router.get("/chat/:chatId/paginated", selfOrAdminParam("chatId"), msgController.getPaginated);
router.get("/chat/:chatId/latest", selfOrAdminParam("chatId"), msgController.getLatest);
router.get("/chat/:chatId/count", selfOrAdminParam("chatId"), msgController.getCount);
router.get("/chat/:chatId/ai", selfOrAdminParam("chatId"), msgController.getAIOnly);
router.get("/chat/:chatId/search", selfOrAdminParam("chatId"), msgController.search);
router.put("/:id", selfOrAdmin, validate(updateMessageSchema), msgController.update);
router.patch("/:id/feedback", msgController.updateFeedback);
router.delete("/chat/:chatId", selfOrAdminParam("chatId"), msgController.removeByChat);
router.delete("/:id", selfOrAdmin, msgController.remove);

export default router;
