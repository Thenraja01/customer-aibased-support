import express from "express";
import * as ticketController from "./ticket.controller.js";
import { protect, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createTicketSchema, assignTicketSchema, updatePrioritySchema } from "../../validation/index.js";

// RBAC: staff (admin / branch_admin / support) manage the ticket queue.
const STAFF = ["admin", "branch_admin", "support"];

const router = express.Router();

router.use(protect);

router.post("/", validate(createTicketSchema), ticketController.create);
router.post("/escalate-from-chat", ticketController.escalateFromChat);
router.get("/queue", checkRole(...STAFF), ticketController.getQueue);
router.post("/:ticketId/smart-assign", checkRole(...STAFF), ticketController.smartAssignTicket);
router.get("/stats", checkRole(...STAFF), ticketController.getStats);
router.get("/", checkRole(...STAFF), ticketController.getAll);
router.get("/user/:userId", selfOrAdminParam("userId"), ticketController.getByUser);
router.get("/support/:supportId", checkRole(...STAFF), ticketController.getBySupport);
router.get("/status/:status", checkRole(...STAFF), ticketController.getByStatus);
router.get("/:id", ticketController.getById);

router.patch("/:id/assign", checkRole(...STAFF), validate(assignTicketSchema), ticketController.assign);
router.patch("/:id/priority", checkRole(...STAFF), validate(updatePrioritySchema), ticketController.changePriority);
router.patch("/:id/in-progress", checkRole(...STAFF), ticketController.setInProgress);
router.patch("/:id/pending", checkRole(...STAFF), ticketController.setPending);
router.patch("/:id/resolve", checkRole(...STAFF), ticketController.resolve);
router.patch("/:id/close", checkRole(...STAFF), ticketController.close);
router.patch("/:id/reopen", ticketController.reopen);

router.delete("/:id", checkRole("admin"), ticketController.remove);

router.get("/:ticketId/messages", ticketController.getMessages);
router.post("/:ticketId/messages", ticketController.sendMessage);
router.delete("/:ticketId/messages/:messageId", checkRole(...STAFF), ticketController.deleteMessage);

export default router;