import express from "express";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentTypeSchema, updateDocumentTypeSchema } from "../../validation/documentType.validation.js";
import { createRoleSchema, updateRoleSchema } from "../../validation/role.validation.js";
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
router.get("/knowledge-graph-stats", restrict("super admin", "admin"), adminController.getKnowledgeGraphStats);

router.get("/document-types", restrict("super admin", "admin"), adminController.getDocumentTypes);
router.post("/document-types", restrict("super admin", "admin"), validate(createDocumentTypeSchema), adminController.createDocumentType);
router.put("/document-types/:id", restrict("super admin", "admin"), validate(updateDocumentTypeSchema), adminController.updateDocumentType);
router.delete("/document-types/:id", restrict("super admin", "admin"), adminController.deleteDocumentType);

export default router;
