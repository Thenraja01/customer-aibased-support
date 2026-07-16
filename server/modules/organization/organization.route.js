import express from "express";
import * as orgController from "./organization.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createOrganizationSchema, updateOrganizationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin"), validate(createOrganizationSchema), orgController.create);
router.get("/", restrict("admin", "agent"), orgController.getAll);
router.get("/search", restrict("admin", "agent"), orgController.search);
router.get("/:id", restrict("admin", "agent"), orgController.getById);
router.put("/:id", restrict("admin"), validate(updateOrganizationSchema), orgController.update);
router.delete("/:id", restrict("admin"), orgController.remove);

export default router;
