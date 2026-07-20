import express from "express";
import * as apiUsageController from "./apiUsage.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);
router.use(restrict("admin", "super_admin"));

router.get("/", apiUsageController.getAll);
router.get("/stats", apiUsageController.getStats);
router.get("/daily", apiUsageController.getDailyStats);
router.delete("/cleanup", apiUsageController.cleanup);

export default router;
