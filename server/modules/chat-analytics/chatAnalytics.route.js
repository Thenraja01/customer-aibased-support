import express from "express";
import * as chatAnalyticsController from "./chatAnalytics.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/", restrict("admin", "super_admin"), chatAnalyticsController.getAll);
router.get("/stats", restrict("admin", "super_admin"), chatAnalyticsController.getStats);
router.get("/:chatId", chatAnalyticsController.getByChatId);
router.delete("/:chatId", restrict("admin", "super_admin"), chatAnalyticsController.remove);

export default router;
