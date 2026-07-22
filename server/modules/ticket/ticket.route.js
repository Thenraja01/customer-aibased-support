import express from "express";
import * as ticketController from "./ticket.controller.js";
import { protect, restrict, selfOrAdmin, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createTicketSchema, assignTicketSchema, updatePrioritySchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(createTicketSchema), ticketController.create);
router.get("/stats", restrict("super admin", "tenant admin", "admin", "support"), ticketController.getStats);
router.get("/", restrict("super admin", "tenant admin", "admin", "support"), ticketController.getAll);
router.get("/user/:userId", selfOrAdminParam("userId"), ticketController.getByUser);
router.get("/support/:supportId", restrict("super admin", "tenant admin", "admin", "support"), ticketController.getBySupport);
router.get("/status/:status", restrict("super admin", "tenant admin", "admin", "support"), ticketController.getByStatus);
router.get("/:id", ticketController.getById);
router.patch("/:id/assign", restrict("super admin", "tenant admin", "admin", "support"), validate(assignTicketSchema), ticketController.assign);
router.patch("/:id/priority", restrict("super admin", "tenant admin", "admin", "support"), validate(updatePrioritySchema), ticketController.changePriority);
router.patch("/:id/resolve", restrict("super admin", "tenant admin", "admin", "support"), ticketController.resolve);
router.patch("/:id/close", restrict("super admin", "tenant admin", "admin", "support"), ticketController.close);
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), ticketController.remove);

export default router;
