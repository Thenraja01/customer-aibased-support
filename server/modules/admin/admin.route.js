import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentTypeSchema, updateDocumentTypeSchema } from "../../validation/documentType.validation.js";
import { createRoleSchema, updateRoleSchema } from "../../validation/role.validation.js";
import { updateOrganizationSettingsSchema } from "../../validation/organizationSettings.validation.js";
import { updateGlobalSettingsSchema } from "../../validation/globalSetting.validation.js";
import * as adminController from "./admin.controller.js";
import * as aiConfigController from "../ai/aiConfig.controller.js";
import * as billingController from "../billing/billing.controller.js";
import * as analyticsController from "../analytics/analytics.controller.js";
import { uploadAvatar, handleUpload } from "../../middleware/upload.middleware.js";

// RBAC: every route below is gated purely by role.
//   super_admin      → always allowed (bypasses checkRole)
//   admin / branch_admin → organization-level access
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);
router.use(attachScope);

router.get("/dashboard/stats", checkRole(...ADMIN), adminController.dashboardStats);

router.get("/organizations", checkRole("admin"), adminController.getOrganizations);
router.get("/organizations/:id/users", checkRole(...ADMIN), adminController.getOrganizationUsers);

// Organization management — Super Admin only (RBAC)
router.post("/organizations", checkRole("super_admin"), adminController.createOrg);
router.get("/organizations/:id/full-details", checkRole("super_admin"), adminController.getOrgFullDetails);
router.get("/organizations/:id/analytics", checkRole("super_admin"), adminController.getOrgAnalytics);
router.put("/organizations/:id", checkRole("super_admin"), adminController.updateOrg);
router.post("/organizations/:id/logo", checkRole("super_admin"), handleUpload(uploadAvatar), adminController.uploadOrgLogo);
router.post("/organization/logo", checkRole("admin"), handleUpload(uploadAvatar), adminController.uploadOrgLogo);
router.delete("/organizations/:id", checkRole("super_admin"), adminController.deleteOrg);

router.get("/users", checkRole(...ADMIN), adminController.getUsers);
router.post("/users", checkRole("admin"), adminController.addUser);
router.put("/users/:id", checkRole("admin"), adminController.editUser);
router.patch("/users/:id/status", checkRole("admin"), adminController.patchUserStatus);
router.delete("/users/:id", checkRole("admin"), adminController.removeUser);

router.get("/roles", checkRole("admin"), adminController.getRoles);
router.post("/roles", checkRole("admin"), validate(createRoleSchema), adminController.addRole);
router.put("/roles/:id", checkRole("admin"), validate(updateRoleSchema), adminController.editRole);
router.delete("/roles/:id", checkRole("admin"), adminController.removeRole);
router.get("/permissions/categories", checkRole("admin"), adminController.getPermissionCategories);

router.get("/audit-logs", checkRole(...ADMIN), adminController.getAuditLogs);
router.get("/audit-logs/export", checkRole(...ADMIN), adminController.exportAuditLogs);

router.get("/documents", checkRole(...ADMIN), adminController.getDocuments);
router.get("/documents/:id", checkRole(...ADMIN), adminController.getDocumentById);
router.get("/documents/:id/chunks", checkRole(...ADMIN), adminController.getDocumentChunks);

router.get("/document-verifications", checkRole(...ADMIN), adminController.getDocumentVerifications);
router.patch("/document-verifications/:id/approve", checkRole("admin"), adminController.approveDocument);
router.patch("/document-verifications/:id/reject", checkRole("admin"), adminController.rejectDocument);

router.get("/rag-stats", checkRole("admin"), adminController.getRAGStats);

router.get("/document-types", checkRole(...ADMIN), adminController.getDocumentTypes);
router.post("/document-types", checkRole("admin"), validate(createDocumentTypeSchema), adminController.createDocumentType);
router.put("/document-types/:id", checkRole("admin"), validate(updateDocumentTypeSchema), adminController.updateDocumentType);
router.delete("/document-types/:id", checkRole("admin"), adminController.deleteDocumentType);

// Own-org settings — readable by any org member (used for branding), writable by org admins
router.get("/organization/settings", adminController.getOrgSettings);
router.put("/organization/settings", checkRole("admin"), validate(updateOrganizationSettingsSchema), adminController.updateOrgSettings);

router.get("/settings", adminController.getOrgSettings);
router.put("/settings", checkRole("admin"), validate(updateOrganizationSettingsSchema), adminController.updateOrgSettings);

// SMTP test — admin only, uses request-body smtp_config (does NOT require saving first)
router.post("/smtp/test", checkRole("admin"), adminController.testSmtpConfig);


// AI configs management
router.get("/ai-configs", checkRole("admin"), aiConfigController.getAIConfigs);
router.post("/ai-configs", checkRole("admin"), aiConfigController.createAIConfig);
router.put("/ai-configs/:id", checkRole("admin"), aiConfigController.updateAIConfig);
router.patch("/ai-configs/:id/set-default", checkRole("admin"), aiConfigController.setDefaultModel);
router.patch("/ai-configs/reorder", checkRole("admin"), aiConfigController.reorderPriorities);
router.post("/ai-configs/:id/reset-circuit", checkRole("admin"), aiConfigController.resetCircuitBreaker);
router.delete("/ai-configs/:id", checkRole("admin"), aiConfigController.deleteAIConfig);
router.post("/ai-configs/:id/test", checkRole("admin"), aiConfigController.testAIConfig);

// Billing (own-org)
router.get("/billing", checkRole(...ADMIN), billingController.getBilling);
router.get("/billing/invoices", checkRole(...ADMIN), billingController.getInvoices);
router.get("/billing/invoices/:id/download", checkRole(...ADMIN), billingController.downloadInvoice);
router.post("/billing/change-plan", checkRole("admin"), billingController.changePlan);

// SuperAdmin Billing Analytics, Global Invoices & Custom Plan Configurator
router.get("/superadmin/billing/overview", checkRole("super_admin"), billingController.getSuperAdminBillingOverview);
router.get("/superadmin/billing/invoices", checkRole("super_admin"), billingController.getSuperAdminInvoices);
router.get("/superadmin/billing/plans", checkRole("super_admin"), billingController.getPlatformPlans);
router.post("/superadmin/billing/plans", checkRole("super_admin"), billingController.savePlatformPlan);
router.delete("/superadmin/billing/plans/:planKey", checkRole("super_admin"), billingController.deletePlatformPlan);

// Guardrails Testing (own-org & super-admin)
router.post("/guardrails/test", checkRole(...ADMIN), adminController.testGuardrails);

// Analytics (own-org)
router.get("/analytics/overview", checkRole(...ADMIN), analyticsController.getOverview);
router.get("/analytics/ai-usage", checkRole(...ADMIN), analyticsController.getAIUsage);

// Org self-service API keys (own-org, admin)
router.get("/organization/api-keys", checkRole(...ADMIN), adminController.getMyOrgApiKeys);
router.post("/organization/api-keys", checkRole("admin"), adminController.createMyOrgApiKey);
router.delete("/organization/api-keys/:keyId", checkRole("admin"), adminController.revokeMyOrgApiKey);

// Other org's settings — Super Admin only
router.get("/organizations/:orgId/settings", checkRole("super_admin"), adminController.getOrgSettings);
router.put("/organizations/:orgId/settings", checkRole("super_admin"), validate(updateOrganizationSettingsSchema), adminController.updateOrgSettings);

// Suspend / activate / usage — Super Admin only
router.patch("/organizations/:id/suspend", checkRole("super_admin"), adminController.suspendOrg);
router.patch("/organizations/:id/activate", checkRole("super_admin"), adminController.activateOrg);
router.get("/usage/stats", checkRole("super_admin"), adminController.getUsageStats);
router.post("/organizations/:id/api-keys", checkRole("super_admin"), adminController.createOrgApiKey);
router.delete("/organizations/:id/api-keys/:keyId", checkRole("super_admin"), adminController.revokeOrgApiKey);

router.get("/users/basic", checkRole(...ADMIN), adminController.getUsersBasic);

router.get("/chats", checkRole(...ADMIN), adminController.getChats);
router.get("/chats/export", checkRole(...ADMIN), adminController.exportChats);
router.get("/chats/:id", checkRole(...ADMIN), adminController.getChatDetail);
router.patch("/chats/:id/status", checkRole(...ADMIN), adminController.updateChatStatus);
router.delete("/chats/:id", checkRole("admin"), adminController.deleteChat);

// Bulk chat delete — org-scoped for admin/branch_admin; global for Super Admin
router.delete("/chats", checkRole(...ADMIN), adminController.deleteAllChats);

router.get("/knowledge-graph-stats", checkRole("super_admin"), adminController.getKnowledgeGraphStats);

// Command Center (Super Admin Only)
router.get("/command-center/status", checkRole("super_admin"), adminController.getCommandCenterStatus);
router.post("/command-center/toggle-maintenance", checkRole("super_admin"), adminController.toggleMaintenanceMode);
router.post("/command-center/global-notification", checkRole("super_admin"), adminController.sendGlobalNotification);
router.post("/command-center/impersonate", checkRole("super_admin"), adminController.impersonateOrg);
router.post("/command-center/clear-cache", checkRole("super_admin"), adminController.clearSystemCache);
router.post("/command-center/restart-jobs", checkRole("super_admin"), adminController.restartBackgroundJobs);
router.post("/command-center/backup-db", checkRole("super_admin"), adminController.backupDatabase);

// Global Application Settings (Super Admin Only)
router.get("/global-settings", checkRole("super_admin"), adminController.getGlobalSettings);
router.put("/global-settings", checkRole("super_admin"), validate(updateGlobalSettingsSchema), adminController.updateGlobalSettings);

// RAG Evaluation & AI Provider Health Metrics
router.get("/rag-eval", checkRole(...ADMIN), adminController.getRAGEvaluation);
router.get("/llm-health", checkRole(...ADMIN), adminController.getLLMHealth);

// Email Template Testing & AI Polish
router.post("/email-templates/test", checkRole(...ADMIN), adminController.testEmailTemplate);
router.post("/email-templates/polish", checkRole(...ADMIN), adminController.polishEmailTemplate);

export default router;
