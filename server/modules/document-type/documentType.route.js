import express from "express";
import * as dtController from "./documentType.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentTypeSchema, updateDocumentTypeSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("super admin", "tenant admin", "admin"), validate(createDocumentTypeSchema), dtController.create);
router.get("/", restrict("super admin", "tenant admin", "admin", "support"), dtController.getAll);
router.get("/:id", restrict("super admin", "tenant admin", "admin", "support"), dtController.getById);
router.put("/:id", restrict("super admin", "tenant admin", "admin"), validate(updateDocumentTypeSchema), dtController.update);
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), dtController.remove);

export default router;
