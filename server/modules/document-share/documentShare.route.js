import express from "express";
import * as documentShareController from "./documentShare.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentShareSchema, updateDocumentShareSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(createDocumentShareSchema), documentShareController.create);
router.get("/my", documentShareController.getMyShares);
router.get("/", restrict("admin", "support"), documentShareController.getAll);
router.get("/:documentId", documentShareController.getByDocument);
router.put("/:id", validate(updateDocumentShareSchema), documentShareController.update);
router.delete("/:id", documentShareController.remove);

export default router;
