import express from "express";
import * as auditController from "./auditLog.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("super admin", "tenant admin", "admin"), auditController.create);
router.get("/", restrict("super admin", "tenant admin", "admin"), auditController.getAll);
router.get("/user/:userId", restrict("super admin", "tenant admin", "admin"), auditController.getByUser);
router.get("/table/:tableName", restrict("super admin", "tenant admin", "admin"), auditController.getByTable);
router.get("/record/:tableName/:recordId", restrict("super admin", "tenant admin", "admin"), auditController.getByRecord);
router.get("/action/:action", restrict("super admin", "tenant admin", "admin"), auditController.getByAction);
router.get("/range", restrict("super admin", "tenant admin", "admin"), auditController.getByDateRange);
router.delete("/cleanup", restrict("super admin", "tenant admin", "admin"), auditController.cleanup);

export default router;
