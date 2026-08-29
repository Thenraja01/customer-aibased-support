import express from "express";
import * as branchController from "./branch.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";

// RBAC: admins view branches; create/update/delete are admin (org) level.
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);
router.use(attachScope);

router.post("/", checkRole("admin"), branchController.create);
router.get("/", checkRole(...ADMIN), branchController.getAll);
router.get("/search", checkRole(...ADMIN), branchController.search);
router.get("/:id", checkRole(...ADMIN), branchController.getById);
router.put("/:id", checkRole("admin"), branchController.update);
router.delete("/:id", checkRole("admin"), branchController.remove);

export default router;