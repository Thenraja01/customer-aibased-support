import express from "express";
import * as bulkOperationController from "./bulkOperation.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", bulkOperationController.create);
router.get("/my", bulkOperationController.getMyOperations);
router.get("/", restrict("admin", "super_admin"), bulkOperationController.getAll);
router.get("/:id", bulkOperationController.getById);
router.put("/:id/status", restrict("admin", "super_admin"), bulkOperationController.updateStatus);

export default router;
