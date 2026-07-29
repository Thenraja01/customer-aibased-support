import express from "express";
import * as communicationController from "./communication.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";
import { tenantIsolation } from "../../middleware/authorize.middleware.js";

const router = express.Router();

router.use(protect);
router.use(tenantIsolation);

router.post("/send", communicationController.send);
router.post("/send/org", access("notification.broadcast"), communicationController.sendToOrg);

router.get("/conversation/:userId", access("chat.view_history"), communicationController.getConversation);
router.get("/org-conversations", access("notification.broadcast"), communicationController.getOrgConversations);
router.get("/org/:orgId", access("chat.view_history"), communicationController.getOrgMessages);
router.get("/my-org", communicationController.getMyOrgMessages);
router.get("/unread/count", communicationController.getUnreadCount);
router.get("/unread", communicationController.getUnread);
router.get("/partners", access("notification.broadcast"), communicationController.getPartners);

router.patch("/:id/read", communicationController.markRead);
router.patch("/org/:orgId/seen", access("notification.broadcast"), communicationController.markOrgSeen);
router.patch("/read-all", communicationController.markAllRead);

export default router;