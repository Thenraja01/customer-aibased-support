import express from "express";
import * as commentController from "./ticketComment.controller.js";
import { protect, restrict, selfOrAdmin } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", commentController.create);
router.get("/ticket/:ticketId", commentController.getByTicket);
router.get("/:id", commentController.getById);
router.put("/:id", selfOrAdmin, commentController.update);
router.delete("/:id", restrict("admin", "support"), commentController.remove);

export default router;
