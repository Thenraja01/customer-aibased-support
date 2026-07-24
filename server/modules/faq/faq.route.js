import express from "express";
import * as faqController from "./faq.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createFaqSchema, updateFaqSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("super admin", "tenant admin", "admin", "support"), validate(createFaqSchema), faqController.create);
router.get("/active", faqController.getActive);
router.get("/my", restrict("super admin", "tenant admin", "admin", "support"), faqController.getMyFaqs);
router.get("/status/:status", restrict("super admin", "tenant admin", "admin", "support"), faqController.getByStatus);
router.get("/", restrict("super admin", "tenant admin", "admin", "support"), faqController.getAll);
router.get("/:id", restrict("super admin", "tenant admin", "admin", "support"), faqController.getById);
router.put("/:id", restrict("super admin", "tenant admin", "admin", "support"), validate(updateFaqSchema), faqController.update);
router.patch("/:id/approve", restrict("super admin", "tenant admin", "admin"), faqController.approve);
router.patch("/:id/reject", restrict("super admin", "tenant admin", "admin"), faqController.reject);
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), faqController.remove);

export default router;
