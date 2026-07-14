import express from "express";
import {
  create,
  getAll,
  getByUser,
  getByTable,
  getByRecord,
  getByAction,
  getByDateRange,
  cleanup,
} from "../controller/auditLog.controller.js";
import { protect, restrict } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin"), create); // Typically created internally by services, but exposed for manual tests
router.get("/", restrict("admin"), getAll);
router.get("/user/:userId", restrict("admin"), getByUser);
router.get("/table/:tableName", restrict("admin"), getByTable);
router.get("/record/:tableName/:recordId", restrict("admin"), getByRecord);
router.get("/action/:action", restrict("admin"), getByAction);
router.get("/range", restrict("admin"), getByDateRange);
router.delete("/cleanup", restrict("admin"), cleanup);

export default router;
