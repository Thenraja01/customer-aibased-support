import express from "express";
import * as faqController from "./faq.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createFaqSchema, updateFaqSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "support"), validate(createFaqSchema), faqController.create);
router.get("/active", faqController.getActive);
router.get("/", restrict("admin", "support"), faqController.getAll);
router.get("/:id", restrict("admin", "support"), faqController.getById);
router.put("/:id", restrict("admin", "support"), validate(updateFaqSchema), faqController.update);
router.delete("/:id", restrict("admin"), faqController.remove);

export default router;
