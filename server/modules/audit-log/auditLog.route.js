import express from "express";
import * as auditController from "./auditLog.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", access("report.view"), auditController.create);
router.get("/", access("report.view"), auditController.getAll);
router.get("/user/:userId", access("report.view"), auditController.getByUser);
router.get("/table/:tableName", access("report.view"), auditController.getByTable);
router.get("/record/:tableName/:recordId", access("report.view"), auditController.getByRecord);
router.get("/action/:action", access("report.view"), auditController.getByAction);
router.get("/range", access("report.view"), auditController.getByDateRange);
router.delete("/cleanup", access("report.view"), auditController.cleanup);

export default router;