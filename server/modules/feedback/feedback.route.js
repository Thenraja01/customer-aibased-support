import express from "express";
import * as feedbackController from "./feedback.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";
import { tenantIsolation } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { submitFeedbackSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);
router.use(tenantIsolation);

router.post("/", validate(submitFeedbackSchema), feedbackController.submit);

router.get("/chat/:chatId", access("ai.summarize"), feedbackController.getByChat);
router.get("/stats", access("ai.summarize"), feedbackController.getStats);

export default router;