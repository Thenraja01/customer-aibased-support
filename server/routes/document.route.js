import express from "express";
import {
  upload,
  getAll,
  getPendingRag,
  getById,
  getByUser,
  getByStatus,
  patchStatus,
  patchRagStatus,
  remove,
} from "../controller/document.controller.js";
import { protect, restrict, selfOrAdmin } from "../middleware/auth.middleware.js";
import { uploadToCloud, handleUpload } from "../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);
router.post("/upload", handleUpload(uploadToCloud), upload);
router.get("/", restrict("admin", "agent"), getAll);
router.get("/pending-rag", restrict("admin", "agent"), getPendingRag);
router.get("/:id", getById);
router.get("/user/:userId", selfOrAdmin, getByUser);
router.get("/status/:status", restrict("admin", "agent"), getByStatus);
router.patch("/:id/status", restrict("admin", "agent"), patchStatus);
router.patch("/:id/rag-status", restrict("admin", "agent"), patchRagStatus);
router.delete("/:id", restrict("admin"), remove);

export default router;
