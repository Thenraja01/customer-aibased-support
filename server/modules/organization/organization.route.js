import express from "express";
import * as orgController from "./organization.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createOrganizationSchema, updateOrganizationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", checkRole("super_admin"), validate(createOrganizationSchema), orgController.create);
router.get("/", checkRole(...["admin", "branch_admin"]), orgController.getAll);
router.get("/search", checkRole(...["admin", "branch_admin"]), orgController.search);
router.get("/:id", checkRole(...["admin", "branch_admin"]), orgController.getById);
router.put("/:id", checkRole("super_admin"), validate(updateOrganizationSchema), orgController.update);
router.delete("/:id", checkRole("super_admin"), orgController.remove);

export default router;