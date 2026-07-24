import express from "express";
import * as dvController from "./documentVerification.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createVerificationSchema, rejectVerificationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

// Admin and Support: View verification queue
router.get("/", restrict("super admin", "tenant admin", "admin", "support"), dvController.getAll);
router.get("/document/:documentId", restrict("super admin", "tenant admin", "admin", "support"), dvController.getByDocument);
router.get("/status/:status", restrict("super admin", "tenant admin", "admin", "support"), dvController.getByStatus);

// Admin only: Approve/Reject documents (triggers RAG indexing on approve)
router.patch("/:id/approve", restrict("super admin", "tenant admin", "admin"), dvController.approve);
router.patch("/:id/reject", restrict("super admin", "tenant admin", "admin"), validate(rejectVerificationSchema), dvController.reject);

// Admin only: Delete verification entries
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), dvController.remove);

export default router;
