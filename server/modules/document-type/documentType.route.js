import express from "express";
import * as dtController from "./documentType.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentTypeSchema, updateDocumentTypeSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", access("*"), validate(createDocumentTypeSchema), dtController.create);
router.get("/", access("document.view"), dtController.getAll);
router.get("/:id", access("document.view"), dtController.getById);
router.put("/:id", access("*"), validate(updateDocumentTypeSchema), dtController.update);
router.delete("/:id", access("*"), dtController.remove);

export default router;