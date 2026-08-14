import express from "express";
import * as faqController from "./faq.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createFaqSchema, updateFaqSchema } from "../../validation/index.js";

// RBAC: staff (admin / branch_admin / support) manage knowledge; customers read active FAQs.
const STAFF = ["admin", "branch_admin", "support"];

const router = express.Router();

router.use(protect);

router.post("/", checkRole(...STAFF), validate(createFaqSchema), faqController.create);
router.get("/active", faqController.getActive);
router.get("/my", checkRole(...STAFF), faqController.getMyFaqs);
router.get("/status/:status", checkRole(...STAFF), faqController.getByStatus);
router.get("/", checkRole(...STAFF), faqController.getAll);
router.get("/:id", checkRole(...STAFF), faqController.getById);
router.put("/:id", checkRole(...STAFF), validate(updateFaqSchema), faqController.update);
router.patch("/:id/approve", checkRole(...STAFF), faqController.approve);
router.patch("/:id/reject", checkRole(...STAFF), faqController.reject);
router.delete("/:id", checkRole("admin"), faqController.remove);

export default router;