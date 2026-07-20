import express from "express";
import * as qrController from "./quickReply.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "support"), qrController.create);
router.get("/", qrController.getAll);
router.get("/:id", qrController.getById);
router.put("/:id", restrict("admin", "support"), qrController.update);
router.delete("/:id", restrict("admin"), qrController.remove);

export default router;
