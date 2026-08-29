import express from "express";
import * as docController from "./document.controller.js";
import { protect, protectFromQueryToken, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentSchema, updateDocumentStatusSchema } from "../../validation/index.js";
import { uploadToGridFS, handleUpload } from "../../middleware/upload.middleware.js";

// RBAC: admins manage document verification and deletion.
const ADMINS = ["super_admin", "admin", "branch_admin"];
// STAFF can view
const STAFF = ["super_admin", "admin", "branch_admin", "support"];

const router = express.Router();

// The view route is registered before the global `protect` so it can accept a
// `?token=` query param (file_url embeds it) as well as an Authorization header.
router.get("/:id/view", protectFromQueryToken, docController.viewDocument);
router.get("/:id/content", protectFromQueryToken, docController.getDocumentContent);

router.use(protect);

router.post("/", checkRole(...ADMINS), handleUpload(uploadToGridFS), validate(createDocumentSchema), docController.upload);
router.post("/upload", checkRole(...ADMINS), handleUpload(uploadToGridFS), validate(createDocumentSchema), docController.upload);
router.post("/:id/versions", checkRole(...ADMINS), handleUpload(uploadToGridFS), docController.uploadNewVersion);
router.post("/:id/version", checkRole(...ADMINS), handleUpload(uploadToGridFS), docController.uploadNewVersion);
router.post("/:id/retry-ingestion", checkRole(...ADMINS), docController.retryIngestion);
router.post("/:id/reprocess", checkRole(...ADMINS), docController.retryIngestion);
router.post("/:id/abort", checkRole(...ADMINS), docController.abortProcessing);
router.post("/:id/generate-summary", checkRole(...STAFF), docController.generateSummary);

router.get("/", docController.getAll);
router.get("/user/:userId", selfOrAdminParam("userId"), docController.getByUser);
router.get("/status/:status", checkRole(...STAFF), docController.getByStatus);
router.get("/:id", checkRole(...STAFF), docController.getById);

router.put("/:id/metadata", checkRole(...ADMINS), docController.updateMetadata);
router.put("/:id", checkRole(...ADMINS), docController.updateMetadata);
router.patch("/:id/approve", checkRole(...ADMINS), docController.approve);
router.patch("/:id/reject", checkRole(...ADMINS), docController.reject);
router.patch("/:id/publish", checkRole(...ADMINS), docController.publish);
router.patch("/:id/status", checkRole(...ADMINS), validate(updateDocumentStatusSchema), docController.patchStatus);

router.delete("/:id", checkRole(...ADMINS), docController.remove);

router.get("/:id/roles", checkRole(...ADMINS), docController.getRoles);
router.put("/:id/roles", checkRole(...ADMINS), docController.setRoles);

export default router;