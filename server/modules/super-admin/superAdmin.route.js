import express from "express";
import * as superAdminController from "./superAdmin.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";

const router = express.Router();

router.use(protect);
router.use(checkRole("super_admin"));

router.get("/stats", superAdminController.getSystemStats);
router.get("/admins", superAdminController.getSuperAdmins);
router.post("/admins", superAdminController.createSuperAdmin);
router.patch("/organizations/:id/suspend", superAdminController.suspendOrganization);
router.patch("/organizations/:id/activate", superAdminController.activateOrganization);
router.get("/organizations/:id/details", superAdminController.getOrganizationDetails);

export default router;