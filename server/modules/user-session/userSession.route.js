import express from "express";
import * as userSessionController from "./userSession.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/me", userSessionController.getMySessions);
router.get("/", restrict("admin", "super_admin"), userSessionController.getAll);
router.put("/:id/revoke", userSessionController.revoke);
router.put("/revoke-all/:userId", restrict("admin", "super_admin"), userSessionController.revokeAll);
router.delete("/:id", userSessionController.remove);

export default router;
