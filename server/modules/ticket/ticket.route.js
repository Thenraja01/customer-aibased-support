import express from "express";
import * as ticketController from "./ticket.controller.js";
import { protect, restrict, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createTicketSchema, assignTicketSchema, updatePrioritySchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(createTicketSchema), ticketController.create);
router.get("/stats", restrict("admin", "support"), ticketController.getStats);
router.get("/", restrict("admin", "support"), ticketController.getAll);
router.get("/user/:userId", selfOrAdminParam("userId"), ticketController.getByUser);
router.get("/support/:supportId", restrict("admin", "support"), ticketController.getByAgent);
router.get("/status/:status", restrict("admin", "support"), ticketController.getByStatus);
router.get("/:id", ticketController.getById);
router.patch("/:id/assign", restrict("admin", "support"), validate(assignTicketSchema), ticketController.assign);
router.patch("/:id/priority", restrict("admin", "support"), validate(updatePrioritySchema), ticketController.changePriority);
router.patch("/:id/resolve", restrict("admin", "support"), ticketController.resolve);
router.patch("/:id/status", restrict("admin", "support"), ticketController.updateStatus);
router.post("/:id/escalate", restrict("admin", "support"), ticketController.escalate);
router.patch("/:id/close", restrict("admin", "support"), ticketController.close);
router.delete("/:id", restrict("admin"), ticketController.remove);

export default router;
