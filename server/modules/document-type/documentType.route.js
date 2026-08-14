import express from "express";
import * as dtController from "./documentType.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentTypeSchema, updateDocumentTypeSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", checkRole(...["admin", "branch_admin"]), validate(createDocumentTypeSchema), dtController.create);
router.get("/", checkRole(...["admin", "branch_admin"]), dtController.getAll);
router.get("/:id", checkRole(...["admin", "branch_admin"]), dtController.getById);
router.put("/:id", checkRole("admin"), validate(updateDocumentTypeSchema), dtController.update);
router.delete("/:id", checkRole("admin"), dtController.remove);

export default router;