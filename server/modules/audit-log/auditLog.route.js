import express from "express";
import * as auditController from "./auditLog.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";

// RBAC: admin, branch_admin, super_admin can view audit logs
const ADMIN_ROLES = ["admin", "branch_admin", "super_admin"];

const router = express.Router();

router.use(protect);
router.use(attachScope);
router.use(checkRole(...ADMIN_ROLES));

router.post("/", auditController.create);
router.get("/", auditController.getAll);
router.get("/paginated", auditController.getPaginated);
router.get("/user/:userId", auditController.getByUser);
router.get("/table/:tableName", auditController.getByTable);
router.get("/record/:tableName/:recordId", auditController.getByRecord);
router.get("/action/:action", auditController.getByAction);
router.get("/range", auditController.getByDateRange);
router.delete("/cleanup", auditController.cleanup);

export default router;