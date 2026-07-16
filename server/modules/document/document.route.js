import express from "express";
import * as docController from "./document.controller.js";
import { protect, restrict, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentSchema, updateDocumentStatusSchema } from "../../validation/index.js";
import { uploadToCloud, handleUpload } from "../../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "agent"), handleUpload(uploadToCloud), validate(createDocumentSchema), docController.upload);
router.get("/", restrict("admin", "agent"), docController.getAll);
router.get("/user/:userId", restrict("admin", "agent"), selfOrAdminParam("userId"), docController.getByUser);
router.get("/status/:status", restrict("admin", "agent"), docController.getByStatus);
router.get("/:id", restrict("admin", "agent"), docController.getById);
router.patch("/:id/status", restrict("admin", "agent"), validate(updateDocumentStatusSchema), docController.patchStatus);
router.delete("/:id", restrict("admin"), docController.remove);

export default router;
