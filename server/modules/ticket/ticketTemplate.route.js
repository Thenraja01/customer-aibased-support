import express from "express";
import * as templateController from "./ticketTemplate.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("super admin", "tenant admin", "admin"), templateController.create);
router.get("/active", templateController.getActive);
router.get("/", restrict("super admin", "tenant admin", "admin"), templateController.getAll);
router.get("/:id", restrict("super admin", "tenant admin", "admin"), templateController.getById);
router.put("/:id", restrict("super admin", "tenant admin", "admin"), templateController.update);
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), templateController.remove);

export default router;
