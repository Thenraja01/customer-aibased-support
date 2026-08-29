import express from "express";
import * as controller from "./documentApproval.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";

const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);
router.use(attachScope);

// Submit document for approval (admin or branch_admin who uploaded)
router.post("/:id/submit", checkRole(...ADMIN), controller.submitApproval);

// Approve a document
router.post("/:id/approve", checkRole(...ADMIN), controller.approve);

// Reject a document
router.post("/:id/reject", checkRole(...ADMIN), controller.reject);

// Request revision
router.post("/:id/revision", checkRole(...ADMIN), controller.requestRevision);

// Publish an approved document
router.post("/:id/publish", checkRole(...ADMIN), controller.publish);

// Get pending approvals for current user's org/branch
router.get("/pending", checkRole(...ADMIN), controller.getPending);

// Get approval history for a document
router.get("/:id/history", checkRole(...ADMIN), controller.getHistory);

export default router;
