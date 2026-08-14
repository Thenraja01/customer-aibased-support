import express from "express";
import * as notifController from "./notification.controller.js";
import { protect, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createNotificationSchema, broadcastNotificationSchema, broadcastToOrgSchema } from "../../validation/index.js";

// RBAC: admin / branch_admin manage notifications; broadcasts are super_admin-only.
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);

router.post("/", checkRole(...ADMIN), validate(createNotificationSchema), notifController.create);
router.post("/broadcast", checkRole("admin"), validate(broadcastNotificationSchema), notifController.broadcast);
router.post("/broadcast/org", checkRole("admin"), validate(broadcastToOrgSchema), notifController.broadcastToOrg);
router.post("/broadcast/org/:orgId", checkRole("super_admin"), validate(broadcastToOrgSchema), notifController.broadcastToOrgById);
router.post("/broadcast/all", checkRole("super_admin"), validate(broadcastToOrgSchema), notifController.broadcastToAll);

router.post("/preview", checkRole(...ADMIN), validate(broadcastToOrgSchema), notifController.getPreviewCount);
router.get("/campaigns", checkRole(...ADMIN), notifController.getCampaigns);
router.get("/campaigns/:id", checkRole(...ADMIN), notifController.getCampaignById);
router.get("/templates", checkRole(...ADMIN), notifController.getTemplates);
router.post("/templates", checkRole(...ADMIN), notifController.createTemplate);
router.delete("/templates/:id", checkRole(...ADMIN), notifController.deleteTemplate);

router.get("/user/:userId", selfOrAdminParam("userId"), notifController.getByUser);
router.get("/user/:userId/unread", selfOrAdminParam("userId"), notifController.getUnread);
router.get("/user/:userId/unread/count", selfOrAdminParam("userId"), notifController.getUnreadCount);
router.patch("/:id/read", notifController.read);
router.patch("/user/:userId/read-all", selfOrAdminParam("userId"), notifController.readAll);
router.delete("/:id", notifController.remove);
router.delete("/user/:userId/clear", selfOrAdminParam("userId"), notifController.clear);

export default router;