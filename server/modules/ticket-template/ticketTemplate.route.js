import express from "express";
import * as templateController from "./ticketTemplate.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";

const STAFF = ["admin", "super_admin", "branch_admin", "support"];

const router = express.Router();

router.use(protect);
router.use(attachScope);

router.get("/active", templateController.getActive);
router.get("/", templateController.getAll);
router.get("/:id", templateController.getById);

router.post("/", checkRole(...STAFF), templateController.create);
router.put("/:id", checkRole(...STAFF), templateController.update);
router.delete("/:id", checkRole(...STAFF), templateController.remove);

export default router;
