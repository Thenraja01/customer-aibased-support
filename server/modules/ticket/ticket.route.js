import express from "express";
import * as ticketController from "./ticket.controller.js";
import { protect, access, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createTicketSchema, assignTicketSchema, updatePrioritySchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(createTicketSchema), ticketController.create);
router.post("/escalate-from-chat", ticketController.escalateFromChat);
router.get("/queue", access("ticket.assign"), ticketController.getQueue);
router.post("/:ticketId/smart-assign", access("ticket.assign"), ticketController.smartAssignTicket);
router.get("/stats", access("ticket.assign"), ticketController.getStats);
router.get("/", access("ticket.assign"), ticketController.getAll);
router.get("/user/:userId", selfOrAdminParam("userId"), ticketController.getByUser);
router.get("/support/:supportId", access("ticket.assign"), ticketController.getBySupport);
router.get("/status/:status", access("ticket.assign"), ticketController.getByStatus);
router.get("/:id", ticketController.getById);

router.patch("/:id/assign", access("ticket.assign"), validate(assignTicketSchema), ticketController.assign);
router.patch("/:id/priority", access("ticket.update"), validate(updatePrioritySchema), ticketController.changePriority);
router.patch("/:id/in-progress", access("ticket.update"), ticketController.setInProgress);
router.patch("/:id/pending", access("ticket.update"), ticketController.setPending);
router.patch("/:id/resolve", access("ticket.close"), ticketController.resolve);
router.patch("/:id/close", access("ticket.close"), ticketController.close);
router.patch("/:id/reopen", ticketController.reopen);

router.delete("/:id", access("ticket.delete"), ticketController.remove);

router.get("/:ticketId/messages", ticketController.getMessages);
router.post("/:ticketId/messages", ticketController.sendMessage);
router.delete("/:ticketId/messages/:messageId", access("ticket.update"), ticketController.deleteMessage);

export default router;