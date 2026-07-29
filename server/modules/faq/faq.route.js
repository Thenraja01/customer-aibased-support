import express from "express";
import * as faqController from "./faq.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createFaqSchema, updateFaqSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", access("knowledge.create"), validate(createFaqSchema), faqController.create);
router.get("/active", faqController.getActive);
router.get("/my", access("knowledge.view"), faqController.getMyFaqs);
router.get("/status/:status", access("knowledge.create"), faqController.getByStatus);
router.get("/", access("knowledge.view"), faqController.getAll);
router.get("/:id", access("knowledge.view"), faqController.getById);
router.put("/:id", access("knowledge.edit"), validate(updateFaqSchema), faqController.update);
router.patch("/:id/approve", access("knowledge.create"), faqController.approve);
router.patch("/:id/reject", access("knowledge.create"), faqController.reject);
router.delete("/:id", access("knowledge.delete"), faqController.remove);

export default router;