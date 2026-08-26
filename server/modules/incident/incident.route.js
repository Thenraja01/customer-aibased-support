import express from "express";
import * as incidentController from "./incident.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createIncidentSchema, updateIncidentSchema, incidentStatusSchema, linkTicketsSchema } from "../../validation/incident.validation.js";

const STAFF = ["admin", "branch_admin", "support"];
const MANAGERS = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);
router.use(attachScope);

router.get("/", checkRole(...STAFF), incidentController.getAll);
router.post("/", checkRole(...MANAGERS), validate(createIncidentSchema), incidentController.create);
router.get("/:id", checkRole(...STAFF), incidentController.getById);
router.patch("/:id", checkRole(...MANAGERS), validate(updateIncidentSchema), incidentController.update);
router.patch("/:id/status", checkRole(...MANAGERS), validate(incidentStatusSchema), incidentController.changeStatus);
router.patch("/:id/resolve", checkRole(...MANAGERS), incidentController.resolve);
router.post("/:id/tickets", checkRole(...MANAGERS), validate(linkTicketsSchema), incidentController.linkTickets);
router.get("/:id/tickets", checkRole(...STAFF), incidentController.getLinkedTickets);
router.post("/:id/notify", checkRole(...MANAGERS), incidentController.notifyCustomers);

export default router;