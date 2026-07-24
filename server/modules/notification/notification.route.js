import express from "express";
import * as notifController from "./notification.controller.js";
import { protect, restrict, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createNotificationSchema, broadcastNotificationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("super admin", "tenant admin", "admin", "support"), validate(createNotificationSchema), notifController.create);
router.post("/broadcast", restrict("super admin", "tenant admin", "admin"), validate(broadcastNotificationSchema), notifController.broadcast);
router.get("/user/:userId", selfOrAdminParam("userId"), notifController.getByUser);
router.get("/user/:userId/unread", selfOrAdminParam("userId"), notifController.getUnread);
router.get("/user/:userId/unread/count", selfOrAdminParam("userId"), notifController.getUnreadCount);
router.get("/user/:userId/count", selfOrAdminParam("userId"), notifController.getUnreadCount);
router.patch("/:id/read", notifController.read);
router.patch("/user/:userId/read-all", selfOrAdminParam("userId"), notifController.readAll);
router.delete("/:id", notifController.remove);
router.delete("/user/:userId/clear", selfOrAdminParam("userId"), notifController.clear);

export default router;
