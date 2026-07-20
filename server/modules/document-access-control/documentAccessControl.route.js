import express from "express";
import * as documentAccessControlController from "./documentAccessControl.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createAccessControlSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "support"), validate(createAccessControlSchema), documentAccessControlController.create);
router.get("/", restrict("admin", "support"), documentAccessControlController.getAll);
router.get("/:documentId", documentAccessControlController.getByDocument);
router.put("/:id", restrict("admin", "support"), documentAccessControlController.update);
router.delete("/:id", restrict("admin"), documentAccessControlController.remove);

export default router;
