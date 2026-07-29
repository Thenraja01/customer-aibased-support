import express from "express";
import * as orgController from "./organization.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createOrganizationSchema, updateOrganizationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", access("*"), validate(createOrganizationSchema), orgController.create);
router.get("/", access("org.view"), orgController.getAll);
router.get("/search", access("org.view"), orgController.search);
router.get("/:id", access("org.view"), orgController.getById);
router.put("/:id", access("*"), validate(updateOrganizationSchema), orgController.update);
router.delete("/:id", access("*"), orgController.remove);

export default router;