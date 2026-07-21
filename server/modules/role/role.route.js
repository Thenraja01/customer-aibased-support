// routes/role.routes.js
import express from "express";
import * as roleController from "./role.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { authorize } from "../../middleware/authorize.middleware.js";

const router = express.Router();

// Public route to initialize roles (remove in production or add security)
router.post("/initialize", roleController.initialize);

// Protected routes - admin only
router.use(protect);
router.use(authorize("super admin"));

router.post("/", roleController.create);
router.get("/", roleController.getAll);
router.get("/:id", roleController.getById);
router.get("/name/:name", roleController.getByName);
router.put("/:id", roleController.update);
router.delete("/:id", roleController.remove);

export default router;