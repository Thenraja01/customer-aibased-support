import express from "express";
import {
  create,
  getAll,
  getByDocument,
  getByStatus,
  approve,
  reject,
  remove,
} from "../controller/documentVerification.controller.js";
import { protect, restrict } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "agent"), create);
router.get("/", restrict("admin", "agent"), getAll);
router.get("/document/:documentId", restrict("admin", "agent"), getByDocument);
router.get("/status/:status", restrict("admin", "agent"), getByStatus);
router.patch("/:id/approve", restrict("admin", "agent"), approve);
router.patch("/:id/reject", restrict("admin", "agent"), reject);
router.delete("/:id", restrict("admin"), remove);

export default router;
