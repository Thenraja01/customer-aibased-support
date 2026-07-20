import express from "express";
import * as ttController from "./ticketTemplate.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "support"), ttController.create);
router.get("/", restrict("admin", "support"), ttController.getAll);
router.get("/:id", restrict("admin", "support"), ttController.getById);
router.put("/:id", restrict("admin", "support"), ttController.update);
router.delete("/:id", restrict("admin"), ttController.remove);

export default router;
