import express from "express";
import * as orgController from "./organization.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createOrganizationSchema, updateOrganizationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("super admin", "tenant admin", "admin"), validate(createOrganizationSchema), orgController.create);
router.get("/", restrict("super admin", "tenant admin", "admin", "support"), orgController.getAll);
router.get("/search", restrict("super admin", "tenant admin", "admin", "support"), orgController.search);
router.get("/:id", restrict("super admin", "tenant admin", "admin", "support"), orgController.getById);
router.put("/:id", restrict("super admin", "tenant admin", "admin"), validate(updateOrganizationSchema), orgController.update);
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), orgController.remove);

export default router;
