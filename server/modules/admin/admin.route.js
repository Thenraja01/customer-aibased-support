import express from "express";
import { protect, access, anyAccess } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentTypeSchema, updateDocumentTypeSchema } from "../../validation/documentType.validation.js";
import { createRoleSchema, updateRoleSchema } from "../../validation/role.validation.js";
import { updateOrganizationSettingsSchema } from "../../validation/organizationSettings.validation.js";
import { updateGlobalSettingsSchema } from "../../validation/globalSetting.validation.js";
import * as adminController from "./admin.controller.js";

const router = express.Router();

router.use(protect);

router.get("/dashboard/stats", access("report.view_dashboard"), adminController.dashboardStats);

router.get("/organizations", access("org.view"), adminController.getOrganizations);
router.post("/organizations", access("*"), adminController.createOrg);
router.put("/organizations/:id", access("*"), adminController.updateOrg);
router.delete("/organizations/:id", access("*"), adminController.deleteOrg);
router.get("/organizations/:id/users", access("user.view"), adminController.getOrganizationUsers);

router.get("/users", access("user.view"), adminController.getUsers);
router.post("/users", access("user.invite"), adminController.addUser);
router.put("/users/:id", anyAccess("user.update", "user.invite"), adminController.editUser);
router.patch("/users/:id/status", access("user.disable"), adminController.patchUserStatus);
router.delete("/users/:id", anyAccess("user.update", "user.disable"), adminController.removeUser);

router.get("/roles", access("role.view"), adminController.getRoles);
router.post("/roles", access("role.create"), validate(createRoleSchema), adminController.addRole);
router.put("/roles/:id", access("role.create"), validate(updateRoleSchema), adminController.editRole);
router.delete("/roles/:id", access("role.delete"), adminController.removeRole);

router.get("/audit-logs", access("report.view"), adminController.getAuditLogs);

router.get("/documents", access("document.view_all"), adminController.getDocuments);
router.get("/documents/:id", access("document.view_all"), adminController.getDocumentById);
router.get("/documents/:id/chunks", access("document.view_all"), adminController.getDocumentChunks);

router.get("/document-verifications", access("document.view_all"), adminController.getDocumentVerifications);
router.patch("/document-verifications/:id/approve", access("document.approve"), adminController.approveDocument);
router.patch("/document-verifications/:id/reject", access("document.approve"), adminController.rejectDocument);

router.get("/rag-stats", access("report.view"), adminController.getRAGStats);

router.get("/document-types", access("*"), adminController.getDocumentTypes);
router.post("/document-types", access("*"), validate(createDocumentTypeSchema), adminController.createDocumentType);
router.put("/document-types/:id", access("*"), validate(updateDocumentTypeSchema), adminController.updateDocumentType);
router.delete("/document-types/:id", access("*"), adminController.deleteDocumentType);

router.get("/organization/settings", adminController.getOrgSettings);
router.put("/organization/settings", access("org.manage"), validate(updateOrganizationSettingsSchema), adminController.updateOrgSettings);

router.get("/organizations/:orgId/settings", access("*"), adminController.getOrgSettings);
router.put("/organizations/:orgId/settings", access("*"), validate(updateOrganizationSettingsSchema), adminController.updateOrgSettings);

router.patch("/organizations/:id/suspend", access("*"), adminController.suspendOrg);
router.patch("/organizations/:id/activate", access("*"), adminController.activateOrg);
router.get("/usage/stats", access("*"), adminController.getUsageStats);
router.post("/organizations/:id/api-keys", access("*"), adminController.createOrgApiKey);
router.delete("/organizations/:id/api-keys/:keyId", access("*"), adminController.revokeOrgApiKey);

router.get("/users/basic", access("user.view"), adminController.getUsersBasic);

router.get("/chats", access("chat.view"), adminController.getChats);
router.delete("/chats", access("chat.delete"), adminController.deleteAllChats);
router.get("/chats/export", access("chat.view"), adminController.exportChats);
router.get("/chats/:id", access("chat.view"), adminController.getChatDetail);
router.patch("/chats/:id/status", access("chat.end"), adminController.updateChatStatus);
router.delete("/chats/:id", access("chat.delete"), adminController.deleteChat);

// Command Center (Super Admin Only)
router.get("/command-center/status", access("*"), adminController.getCommandCenterStatus);
router.post("/command-center/toggle-maintenance", access("*"), adminController.toggleMaintenanceMode);
router.post("/command-center/global-notification", access("*"), adminController.sendGlobalNotification);
router.post("/command-center/impersonate", access("*"), adminController.impersonateOrg);
router.post("/command-center/clear-cache", access("*"), adminController.clearSystemCache);
router.post("/command-center/restart-jobs", access("*"), adminController.restartBackgroundJobs);
router.post("/command-center/backup-db", access("*"), adminController.backupDatabase);

// Global Application Settings (Super Admin Only)
router.get("/global-settings", access("*"), adminController.getGlobalSettings);
router.put("/global-settings", access("*"), validate(updateGlobalSettingsSchema), adminController.updateGlobalSettings);

// Organization Full Details & Analytics
router.get("/organizations/:id/full-details", access("org.view"), adminController.getOrgFullDetails);
router.get("/organizations/:id/analytics", access("report.view"), adminController.getOrgAnalytics);

export default router;
