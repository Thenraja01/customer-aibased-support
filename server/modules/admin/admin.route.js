import express from "express";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import * as adminController from "./admin.controller.js";

const router = express.Router();

router.use(protect);
router.use(restrict("super_admin"));

router.get("/dashboard/stats", adminController.dashboardStats);

router.get("/organizations", adminController.getOrganizations);
router.post("/organizations", adminController.createOrg);
router.put("/organizations/:id", adminController.updateOrg);
router.delete("/organizations/:id", adminController.deleteOrg);
router.get("/organizations/:id/users", adminController.getOrganizationUsers);

router.get("/users", adminController.getUsers);
router.post("/users", adminController.addUser);
router.put("/users/:id", adminController.editUser);
router.patch("/users/:id/status", adminController.patchUserStatus);
router.delete("/users/:id", adminController.removeUser);

router.get("/roles", adminController.getRoles);
router.post("/roles", adminController.addRole);
router.put("/roles/:id", adminController.editRole);
router.delete("/roles/:id", adminController.removeRole);

router.get("/audit-logs", adminController.getAuditLogs);

export default router;
