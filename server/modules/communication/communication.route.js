import express from "express";
import * as communicationController from "./communication.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { tenantIsolation } from "../../middleware/authorize.middleware.js";

// RBAC: admin / branch_admin broadcast to orgs; staff view conversations.
const ADMIN = ["admin", "branch_admin"];
const STAFF = ["admin", "branch_admin", "support"];

const router = express.Router();

router.use(protect);
router.use(tenantIsolation);

router.post("/send", communicationController.send);
router.post("/send/org", checkRole(...ADMIN), communicationController.sendToOrg);

router.get("/conversation/:userId", checkRole(...STAFF), communicationController.getConversation);
router.get("/org-conversations", checkRole(...ADMIN), communicationController.getOrgConversations);
router.get("/org/:orgId", checkRole(...STAFF), communicationController.getOrgMessages);
router.get("/my-org", communicationController.getMyOrgMessages);
router.get("/unread/count", communicationController.getUnreadCount);
router.get("/unread", communicationController.getUnread);
router.get("/partners", checkRole(...ADMIN), communicationController.getPartners);

router.patch("/:id/read", communicationController.markRead);
router.patch("/org/:orgId/seen", checkRole(...ADMIN), communicationController.markOrgSeen);
router.patch("/read-all", communicationController.markAllRead);

export default router;