import express from "express";
import * as dtController from "./documentType.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentTypeSchema, updateDocumentTypeSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin"), validate(createDocumentTypeSchema), dtController.create);
router.get("/", restrict("admin", "agent"), dtController.getAll);
router.get("/:id", restrict("admin", "agent"), dtController.getById);
router.put("/:id", restrict("admin"), validate(updateDocumentTypeSchema), dtController.update);
router.delete("/:id", restrict("admin"), dtController.remove);

export default router;
