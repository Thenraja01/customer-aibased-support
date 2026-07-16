import express from "express";
import * as dvController from "./documentVerification.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createVerificationSchema, rejectVerificationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "agent"), validate(createVerificationSchema), dvController.create);
router.get("/", restrict("admin", "agent"), dvController.getAll);
router.get("/document/:documentId", restrict("admin", "agent"), dvController.getByDocument);
router.get("/status/:status", restrict("admin", "agent"), dvController.getByStatus);
router.patch("/:id/approve", restrict("admin", "agent"), dvController.approve);
router.patch("/:id/reject", restrict("admin", "agent"), validate(rejectVerificationSchema), dvController.reject);
router.delete("/:id", restrict("admin"), dvController.remove);

export default router;
