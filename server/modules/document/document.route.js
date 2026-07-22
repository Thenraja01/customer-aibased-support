import express from "express";
import * as docController from "./document.controller.js";
import { protect, restrict, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentSchema, updateDocumentStatusSchema } from "../../validation/index.js";
import { uploadToGridFS, handleUpload } from "../../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);

// Admin only: Upload documents
router.post("/", restrict("super admin", "tenant admin", "admin"), handleUpload(uploadToGridFS), validate(createDocumentSchema), docController.upload);

// Admin and Support: View all documents (including drafts/pending for admin)
router.get("/", restrict("super admin", "tenant admin", "admin", "support"), docController.getAll);

// All authenticated users: View own documents
router.get("/user/:userId", restrict("super admin", "tenant admin", "admin", "support", "customer"), selfOrAdminParam("userId"), docController.getByUser);

// Admin and Support: View documents by status
router.get("/status/:status", restrict("super admin", "tenant admin", "admin", "support"), docController.getByStatus);

// Admin and Support: View specific document
router.get("/:id", restrict("super admin", "tenant admin", "admin", "support"), docController.getById);

// Admin only: Approve documents
router.patch("/:id/approve", restrict("super admin", "tenant admin", "admin"), docController.approve);

// Admin only: Reject documents
router.patch("/:id/reject", restrict("super admin", "tenant admin", "admin"), docController.reject);

// Admin and Support: Update document status and assigned_role
router.patch("/:id/status", restrict("super admin", "tenant admin", "admin", "support"), validate(updateDocumentStatusSchema), docController.patchStatus);

// Admin only: Delete documents
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), docController.remove);

export default router;
