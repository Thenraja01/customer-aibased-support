import express from "express";
import * as ntController from "./notificationTemplate.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "support"), ntController.create);
router.get("/", ntController.getAll);
router.get("/:id", ntController.getById);
router.put("/:id", restrict("admin", "support"), ntController.update);
router.delete("/:id", restrict("admin"), ntController.remove);

export default router;
