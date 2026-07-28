import express from "express";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentTypeSchema, updateDocumentTypeSchema } from "../../validation/documentType.validation.js";
import { createRoleSchema, updateRoleSchema } from "../../validation/role.validation.js";
import { updateOrganizationSettingsSchema } from "../../validation/organizationSettings.validation.js";
import { updateGlobalSettingsSchema } from "../../validation/globalSetting.validation.js";
import * as adminController from "./admin.controller.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard/stats", restrict("super admin", "admin"), adminController.dashboardStats);

router.get("/organizations", restrict("super admin", "admin"), adminController.getOrganizations);
router.post("/organizations", restrict("super admin", "admin"), adminController.createOrg);
router.put("/organizations/:id", restrict("super admin", "admin"), adminController.updateOrg);
router.delete("/organizations/:id", restrict("super admin", "admin"), adminController.deleteOrg);
router.get("/organizations/:id/users", restrict("super admin", "admin"), adminController.getOrganizationUsers);

router.get("/users", restrict("super admin", "admin"), adminController.getUsers);
router.post("/users", restrict("super admin", "admin"), adminController.addUser);
router.put("/users/:id", restrict("super admin", "admin"), adminController.editUser);
router.patch("/users/:id/status", restrict("super admin", "admin"), adminController.patchUserStatus);
router.delete("/users/:id", restrict("super admin", "admin"), adminController.removeUser);

router.get("/roles", restrict("super admin", "admin"), adminController.getRoles);
router.post("/roles", restrict("super admin", "admin"), validate(createRoleSchema), adminController.addRole);
router.put("/roles/:id", restrict("super admin", "admin"), validate(updateRoleSchema), adminController.editRole);
router.delete("/roles/:id", restrict("super admin", "admin"), adminController.removeRole);

router.get("/audit-logs", restrict("super admin", "admin"), adminController.getAuditLogs);

router.get("/documents", restrict("super admin", "admin"), adminController.getDocuments);
router.get("/documents/:id", restrict("super admin", "admin"), adminController.getDocumentById);
router.get("/documents/:id/chunks", restrict("super admin", "admin"), adminController.getDocumentChunks);

router.get("/document-verifications", restrict("super admin", "admin"), adminController.getDocumentVerifications);
router.patch("/document-verifications/:id/approve", restrict("super admin", "admin"), adminController.approveDocument);
router.patch("/document-verifications/:id/reject", restrict("super admin", "admin"), adminController.rejectDocument);

router.get("/rag-stats", restrict("super admin", "admin"), adminController.getRAGStats);

router.get("/document-types", restrict("super admin"), adminController.getDocumentTypes);
router.post("/document-types", restrict("super admin"), validate(createDocumentTypeSchema), adminController.createDocumentType);
router.put("/document-types/:id", restrict("super admin"), validate(updateDocumentTypeSchema), adminController.updateDocumentType);
router.delete("/document-types/:id", restrict("super admin"), adminController.deleteDocumentType);

router.get("/organization/settings", restrict("super admin", "admin", "support", "customer"), adminController.getOrgSettings);
router.put("/organization/settings", restrict("super admin", "admin"), validate(updateOrganizationSettingsSchema), adminController.updateOrgSettings);

router.get("/organizations/:orgId/settings", restrict("super admin"), adminController.getOrgSettings);
router.put("/organizations/:orgId/settings", restrict("super admin"), validate(updateOrganizationSettingsSchema), adminController.updateOrgSettings);

router.patch("/organizations/:id/suspend", restrict("super admin"), adminController.suspendOrg);
router.patch("/organizations/:id/activate", restrict("super admin"), adminController.activateOrg);
router.get("/usage/stats", restrict("super admin"), adminController.getUsageStats);
router.post("/organizations/:id/api-keys", restrict("super admin"), adminController.createOrgApiKey);
router.delete("/organizations/:id/api-keys/:keyId", restrict("super admin"), adminController.revokeOrgApiKey);

router.get("/users/basic", restrict("super admin", "tenant admin", "admin"), adminController.getUsersBasic);

router.get("/chats", restrict("super admin", "tenant admin", "admin"), adminController.getChats);
router.delete("/chats", restrict("super admin", "tenant admin", "admin"), adminController.deleteAllChats);
router.get("/chats/export", restrict("super admin", "tenant admin", "admin"), adminController.exportChats);
router.get("/chats/:id", restrict("super admin", "tenant admin", "admin"), adminController.getChatDetail);
router.patch("/chats/:id/status", restrict("super admin", "tenant admin", "admin"), adminController.updateChatStatus);
router.delete("/chats/:id", restrict("super admin", "tenant admin", "admin"), adminController.deleteChat);

// Command Center (Super Admin Only)
router.get("/command-center/status", restrict("super admin"), adminController.getCommandCenterStatus);
router.post("/command-center/toggle-maintenance", restrict("super admin"), adminController.toggleMaintenanceMode);
router.post("/command-center/global-notification", restrict("super admin"), adminController.sendGlobalNotification);
router.post("/command-center/impersonate", restrict("super admin"), adminController.impersonateOrg);
router.post("/command-center/clear-cache", restrict("super admin"), adminController.clearSystemCache);
router.post("/command-center/restart-jobs", restrict("super admin"), adminController.restartBackgroundJobs);
router.post("/command-center/backup-db", restrict("super admin"), adminController.backupDatabase);

// Global Application Settings (Super Admin Only)
router.get("/global-settings", restrict("super admin"), adminController.getGlobalSettings);
router.put("/global-settings", restrict("super admin"), validate(updateGlobalSettingsSchema), adminController.updateGlobalSettings);

// Organization Full Details & Analytics
router.get("/organizations/:id/full-details", restrict("super admin", "admin"), adminController.getOrgFullDetails);
router.get("/organizations/:id/analytics", restrict("super admin", "admin"), adminController.getOrgAnalytics);

export default router;
