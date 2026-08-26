import express from "express";
import * as ticketController from "./ticket.controller.js";
import { protect, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  createTicketSchema,
  assignTicketSchema,
  updatePrioritySchema,
  ticketMessageSchema,
  ticketActionSchema,
} from "../../validation/index.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";

// RBAC: staff (admin / branch_admin / support) manage the ticket queue.
const STAFF = ["admin", "branch_admin", "support"];

const router = express.Router();

router.use(protect);
router.use(attachScope);

router.post("/", validate(createTicketSchema), ticketController.create);
router.post("/escalate-from-chat", ticketController.escalateFromChat);
router.post("/convert-from-chat", ticketController.convertFromChat);
router.get("/queue", checkRole(...STAFF), ticketController.getQueue);
router.get("/escalated", checkRole(...STAFF), ticketController.getEscalated);
router.get("/workload", checkRole(...STAFF), ticketController.getWorkload);
router.post("/:ticketId/smart-assign", checkRole(...STAFF), ticketController.smartAssignTicket);
router.get("/stats", checkRole(...STAFF), ticketController.getStats);
router.get("/unread-count", ticketController.getUnreadCount);
router.get("/number/:ticketNumber", ticketController.getByNumber);
router.get("/", ticketController.getAll);
router.get("/user/:userId", selfOrAdminParam("userId"), ticketController.getByUser);
router.get("/support/:supportId", checkRole(...STAFF), ticketController.getBySupport);
router.get("/status/:status", checkRole(...STAFF), ticketController.getByStatus);
router.get("/:id", ticketController.getById);
router.get("/analytics/ai-metrics", checkRole(...STAFF), ticketController.getAiAnalytics);
router.get("/:id/ai-intelligence", checkRole(...STAFF), ticketController.getAiIntelligence);
router.post("/:id/ai-analyze", checkRole(...STAFF), ticketController.triggerAiAnalysis);
router.post("/:id/apply-priority", checkRole(...STAFF), ticketController.applyAiPriority);
router.post("/:id/ai-feedback", checkRole(...STAFF), ticketController.submitAiFeedback);
router.post("/:id/summary", checkRole(...STAFF), ticketController.generateTicketSummary);

router.patch("/:id/assign", checkRole(...STAFF), validate(assignTicketSchema), ticketController.assign);
router.patch("/:id/priority", checkRole(...STAFF), validate(updatePrioritySchema), ticketController.changePriority);
router.patch("/:id/in-progress", checkRole(...STAFF), ticketController.setInProgress);
router.patch("/:id/pending", checkRole(...STAFF), ticketController.setPending);
router.patch("/:id/resolve", checkRole(...STAFF), ticketController.resolve);
router.patch("/:id/close", ticketController.close);
router.patch("/:id/reopen", ticketController.reopen);
router.patch("/:id/escalate", checkRole(...STAFF), validate(ticketActionSchema), ticketController.escalate);
router.patch("/:id/takeover", checkRole("admin", "branch_admin"), ticketController.takeover);
router.patch("/:id/reject-escalation", checkRole("admin", "branch_admin"), ticketController.rejectEscalation);
router.patch("/:id/cancel", checkRole(...STAFF), validate(ticketActionSchema), ticketController.cancel);

router.delete("/:id", checkRole("admin"), ticketController.remove);

router.get("/:ticketId/messages", ticketController.getMessages);
router.post("/:ticketId/messages", validate(ticketMessageSchema), ticketController.sendMessage);
router.put("/:ticketId/messages/read", ticketController.markRead);
router.delete("/:ticketId/messages/:messageId", checkRole(...STAFF), ticketController.deleteMessage);

export default router;