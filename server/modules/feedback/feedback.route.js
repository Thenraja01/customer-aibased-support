import express from "express";
import * as feedbackController from "./feedback.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { tenantIsolation } from "../../middleware/authorize.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { submitFeedbackSchema } from "../../validation/index.js";

import { optionalProtect } from "../../middleware/optionalAuth.middleware.js";
import { identifyTenant } from "../../middleware/tenant.middleware.js";

// RBAC: admin / branch_admin view AI feedback analytics.
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.post("/csat", optionalProtect, identifyTenant, feedbackController.submitCsat);

router.use(protect);
router.use(tenantIsolation);

router.post("/", validate(submitFeedbackSchema), feedbackController.submit);

router.get("/chat/:chatId", checkRole(...ADMIN), feedbackController.getByChat);
router.get("/stats", checkRole(...ADMIN), feedbackController.getStats);

export default router;