import express from "express";
import * as documentCategoryController from "./documentCategory.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentCategorySchema, updateDocumentCategorySchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin"), validate(createDocumentCategorySchema), documentCategoryController.create);
router.get("/", documentCategoryController.getAll);
router.get("/:id", documentCategoryController.getById);
router.put("/:id", restrict("admin"), validate(updateDocumentCategorySchema), documentCategoryController.update);
router.delete("/:id", restrict("admin"), documentCategoryController.remove);

export default router;
