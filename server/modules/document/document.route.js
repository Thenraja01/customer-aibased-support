import express from "express";
import jwt from "jsonwebtoken";
import * as docController from "./document.controller.js";
import { protect, restrict, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentSchema, updateDocumentStatusSchema } from "../../validation/index.js";
import { uploadToMemory, uploadMultiple, handleUpload } from "../../middleware/upload.middleware.js";
import { checkDocumentAccess, checkKnowledgeBaseUpload, filterDocumentsByRole } from "../../middleware/document.middleware.js";
import env from "../../config/env.js";

const router = express.Router();

const authOrToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    try {
      req.user = jwt.verify(authHeader.split(" ")[1], env.JWT_SECRET);
      return next();
    } catch { /* fall through to token query check */ }
  }
  const token = req.query.token;
  if (token) {
    try {
      req.user = jwt.verify(token, env.JWT_SECRET);
      return next();
    } catch {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
  }
  return res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
};

router.get("/:id/download", authOrToken, restrict("admin", "support"), checkDocumentAccess, docController.download);

router.use(protect);

router.post("/", restrict("admin", "support"), checkKnowledgeBaseUpload, handleUpload(uploadToMemory), validate(createDocumentSchema), docController.upload);
router.post("/bulk", restrict("admin", "support"), checkKnowledgeBaseUpload, handleUpload(uploadMultiple), docController.bulkUpload);
router.get("/", filterDocumentsByRole, docController.getAll);
router.get("/user/:userId", restrict("admin", "support"), selfOrAdminParam("userId"), docController.getByUser);
router.get("/status/:status", restrict("admin", "support"), docController.getByStatus);
router.get("/:id", checkDocumentAccess, docController.getById);
router.get("/:id/download-url", checkDocumentAccess, docController.getDownloadUrl);
router.get("/:id/chunks", restrict("admin"), checkDocumentAccess, docController.getChunks);
router.get("/:id/rag-status", restrict("admin"), checkDocumentAccess, docController.getRagStatus);
router.post("/:id/reindex", restrict("admin"), checkDocumentAccess, docController.reindexDocument);
router.put("/:id", restrict("admin", "support"), checkDocumentAccess, docController.update);
router.patch("/:id/status", restrict("admin"), validate(updateDocumentStatusSchema), docController.patchStatus);
router.delete("/:id", restrict("admin"), checkDocumentAccess, docController.remove);

export default router;
