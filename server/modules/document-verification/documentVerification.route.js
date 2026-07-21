import express from "express";
import * as dvController from "./documentVerification.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createVerificationSchema, rejectVerificationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("super admin", "tenant admin", "admin", "agent"), validate(createVerificationSchema), dvController.create);
router.get("/", restrict("super admin", "tenant admin", "admin", "agent"), dvController.getAll);
router.get("/document/:documentId", restrict("super admin", "tenant admin", "admin", "agent"), dvController.getByDocument);
router.get("/status/:status", restrict("super admin", "tenant admin", "admin", "agent"), dvController.getByStatus);
router.patch("/:id/approve", restrict("super admin", "tenant admin", "admin", "agent"), dvController.approve);
router.patch("/:id/reject", restrict("super admin", "tenant admin", "admin", "agent"), validate(rejectVerificationSchema), dvController.reject);
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), dvController.remove);

export default router;
