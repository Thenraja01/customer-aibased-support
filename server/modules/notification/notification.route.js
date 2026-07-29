import express from "express";
import * as notifController from "./notification.controller.js";
import { protect, access, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createNotificationSchema, broadcastNotificationSchema, broadcastToOrgSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", access("notification.create"), validate(createNotificationSchema), notifController.create);
router.post("/broadcast", access("notification.broadcast"), validate(broadcastNotificationSchema), notifController.broadcast);
router.post("/broadcast/org", access("notification.broadcast"), validate(broadcastToOrgSchema), notifController.broadcastToOrg);
router.post("/broadcast/org/:orgId", access("*"), validate(broadcastToOrgSchema), notifController.broadcastToOrgById);
router.post("/broadcast/all", access("*"), validate(broadcastToOrgSchema), notifController.broadcastToAll);
router.get("/user/:userId", selfOrAdminParam("userId"), notifController.getByUser);
router.get("/user/:userId/unread", selfOrAdminParam("userId"), notifController.getUnread);
router.get("/user/:userId/unread/count", selfOrAdminParam("userId"), notifController.getUnreadCount);
router.patch("/:id/read", notifController.read);
router.patch("/user/:userId/read-all", selfOrAdminParam("userId"), notifController.readAll);
router.delete("/:id", notifController.remove);
router.delete("/user/:userId/clear", selfOrAdminParam("userId"), notifController.clear);

export default router;