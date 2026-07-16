import express from "express";
import * as auditController from "./auditLog.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin"), auditController.create);
router.get("/", restrict("admin"), auditController.getAll);
router.get("/user/:userId", restrict("admin"), auditController.getByUser);
router.get("/table/:tableName", restrict("admin"), auditController.getByTable);
router.get("/record/:tableName/:recordId", restrict("admin"), auditController.getByRecord);
router.get("/action/:action", restrict("admin"), auditController.getByAction);
router.get("/range", restrict("admin"), auditController.getByDateRange);
router.delete("/cleanup", restrict("admin"), auditController.cleanup);

export default router;
