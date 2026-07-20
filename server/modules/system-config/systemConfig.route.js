import express from "express";
import * as systemConfigController from "./systemConfig.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createSystemConfigSchema, updateSystemConfigSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);
router.use(restrict("super_admin"));

router.post("/", validate(createSystemConfigSchema), systemConfigController.create);
router.get("/", systemConfigController.getAll);
router.get("/:key", systemConfigController.getByKey);
router.put("/:key", validate(updateSystemConfigSchema), systemConfigController.update);
router.delete("/:key", systemConfigController.remove);

export default router;
