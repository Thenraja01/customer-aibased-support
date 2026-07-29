import express from "express";
import * as dvController from "./documentVerification.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createVerificationSchema, rejectVerificationSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.get("/", access("document.view_all"), dvController.getAll);
router.get("/document/:documentId", access("document.view_all"), dvController.getByDocument);
router.get("/status/:status", access("document.view_all"), dvController.getByStatus);

router.patch("/:id/approve", access("document.approve"), dvController.approve);
router.patch("/:id/reject", access("document.approve"), validate(rejectVerificationSchema), dvController.reject);

router.delete("/:id", access("document.delete"), dvController.remove);

export default router;