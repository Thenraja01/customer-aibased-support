import express from "express";
import * as branchController from "./branch.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", access("branch.manage"), branchController.create);
router.get("/", access("branch.view"), branchController.getAll);
router.get("/search", access("branch.view"), branchController.search);
router.get("/:id", access("branch.view"), branchController.getById);
router.put("/:id", access("branch.manage"), branchController.update);
router.delete("/:id", access("branch.manage"), branchController.remove);

export default router;