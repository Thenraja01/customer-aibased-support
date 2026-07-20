import express from "express";
import * as notificationPreferenceController from "./notificationPreference.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { updateNotificationPreferenceSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.get("/me", notificationPreferenceController.getMyPreferences);
router.put("/me", validate(updateNotificationPreferenceSchema), notificationPreferenceController.update);
router.get("/", restrict("admin", "super_admin"), notificationPreferenceController.getAll);

export default router;
