import express from "express";
import * as templateController from "./ticketTemplate.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";

// RBAC: staff (admin / branch_admin / support) use templates; management is admin.
const STAFF = ["admin", "branch_admin", "support"];

const router = express.Router();

router.use(protect);

router.post("/", checkRole(...STAFF), templateController.create);
router.get("/active", templateController.getActive);
router.get("/", checkRole(...STAFF), templateController.getAll);
router.get("/:id", checkRole(...STAFF), templateController.getById);
router.put("/:id", checkRole(...STAFF), templateController.update);
router.delete("/:id", checkRole("admin"), templateController.remove);

export default router;