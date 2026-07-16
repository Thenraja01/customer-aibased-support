import express from "express";
import * as ticketController from "./ticket.controller.js";
import { protect, restrict, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createTicketSchema, assignTicketSchema, updatePrioritySchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(createTicketSchema), ticketController.create);
router.get("/stats", restrict("admin", "agent"), ticketController.getStats);
router.get("/", restrict("admin", "agent"), ticketController.getAll);
router.get("/user/:userId", selfOrAdminParam("userId"), ticketController.getByUser);
router.get("/agent/:agentId", restrict("admin", "agent"), ticketController.getByAgent);
router.get("/status/:status", restrict("admin", "agent"), ticketController.getByStatus);
router.get("/:id", ticketController.getById);
router.patch("/:id/assign", restrict("admin", "agent"), validate(assignTicketSchema), ticketController.assign);
router.patch("/:id/priority", restrict("admin", "agent"), validate(updatePrioritySchema), ticketController.changePriority);
router.patch("/:id/resolve", restrict("admin", "agent"), ticketController.resolve);
router.patch("/:id/close", restrict("admin", "agent"), ticketController.close);
router.delete("/:id", restrict("admin"), ticketController.remove);

export default router;
