import express from "express";
import * as docController from "./document.controller.js";
import { protect, access, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentSchema, updateDocumentStatusSchema } from "../../validation/index.js";
import { uploadToGridFS, handleUpload } from "../../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", handleUpload(uploadToGridFS), validate(createDocumentSchema), docController.upload);

router.get("/", access("document.view_all"), docController.getAll);
router.get("/user/:userId", selfOrAdminParam("userId"), docController.getByUser);
router.get("/status/:status", access("document.view_all"), docController.getByStatus);
router.get("/:id", access("document.view_all"), docController.getById);

router.patch("/:id/approve", access("document.approve"), docController.approve);
router.patch("/:id/reject", access("document.approve"), docController.reject);
router.patch("/:id/status", access("document.view_all"), validate(updateDocumentStatusSchema), docController.patchStatus);

router.delete("/:id", access("document.delete"), docController.remove);

router.get("/:id/roles", access("document.edit"), docController.getRoles);
router.put("/:id/roles", access("document.edit"), docController.setRoles);

export default router;