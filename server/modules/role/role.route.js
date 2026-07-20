import express from "express";
import * as roleController from "./role.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createRoleSchema, updateRoleSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin"), validate(createRoleSchema), roleController.create);
router.get("/", restrict("admin", "support"), roleController.getAll);
router.get("/:id", restrict("admin", "support"), roleController.getById);
router.put("/:id", restrict("admin"), validate(updateRoleSchema), roleController.update);
router.delete("/:id", restrict("admin"), roleController.remove);

export default router;
