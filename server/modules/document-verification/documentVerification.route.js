import express from "express";
import * as dvController from "./documentVerification.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createVerificationSchema, rejectVerificationSchema } from "../../validation/index.js";

// RBAC: staff (admin / branch_admin / support) run document verification.
const STAFF = ["admin", "branch_admin", "support"];

const router = express.Router();

router.use(protect);

router.get("/", checkRole(...STAFF), dvController.getAll);
router.get("/document/:documentId", checkRole(...STAFF), dvController.getByDocument);
router.get("/status/:status", checkRole(...STAFF), dvController.getByStatus);

router.patch("/:id/approve", checkRole(...STAFF), dvController.approve);
router.patch("/:id/reject", checkRole(...STAFF), validate(rejectVerificationSchema), dvController.reject);

router.delete("/:id", checkRole("admin"), dvController.remove);

export default router;