import express from "express";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import * as adminController from "./admin.controller.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard/stats", restrict("super admin"), adminController.dashboardStats);

router.get("/organizations", restrict("super admin"), adminController.getOrganizations);
router.post("/organizations", restrict("super admin"), adminController.createOrg);
router.put("/organizations/:id", restrict("super admin"), adminController.updateOrg);
router.delete("/organizations/:id", restrict("super admin"), adminController.deleteOrg);
router.get("/organizations/:id/users", restrict("super admin", "admin"), adminController.getOrganizationUsers);

router.get("/users", restrict("super admin"), adminController.getUsers);
router.post("/users", restrict("super admin", "admin"), adminController.addUser);
router.put("/users/:id", restrict("super admin", "admin"), adminController.editUser);
router.patch("/users/:id/status", restrict("super admin", "admin"), adminController.patchUserStatus);
router.delete("/users/:id", restrict("super admin", "admin"), adminController.removeUser);

router.get("/roles", restrict("super admin", "admin"), adminController.getRoles);
router.post("/roles", restrict("super admin"), adminController.addRole);
router.put("/roles/:id", restrict("super admin"), adminController.editRole);
router.delete("/roles/:id", restrict("super admin"), adminController.removeRole);

router.get("/audit-logs", restrict("super admin"), adminController.getAuditLogs);

export default router;
