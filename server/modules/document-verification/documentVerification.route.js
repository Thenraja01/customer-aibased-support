import express from "express";
import * as dvController from "./documentVerification.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createVerificationSchema, rejectVerificationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "support"), validate(createVerificationSchema), dvController.create);
router.get("/", restrict("admin", "support"), dvController.getAll);
router.get("/document/:documentId", restrict("admin", "support"), dvController.getByDocument);
router.get("/status/:status", restrict("admin", "support"), dvController.getByStatus);
router.patch("/:id/approve", restrict("admin", "support"), dvController.approve);
router.patch("/:id/reject", restrict("admin", "support"), validate(rejectVerificationSchema), dvController.reject);
router.delete("/:id", restrict("admin"), dvController.remove);

export default router;
