import express from "express";
import {
  create,
  broadcast,
  getByUser,
  getUnread,
  getUnreadCount,
  read,
  readAll,
  remove,
  clear,
} from "../controller/notification.controller.js";
import { protect, restrict, selfOrAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin", "agent"), create);
router.post("/broadcast", restrict("admin"), broadcast);
router.get("/user/:userId", selfOrAdmin, getByUser);
router.get("/user/:userId/unread", selfOrAdmin, getUnread);
router.get("/user/:userId/count", selfOrAdmin, getUnreadCount);
router.patch("/:id/read", read); // The controller should technically verify ownership
router.patch("/user/:userId/read-all", selfOrAdmin, readAll);
router.delete("/:id", remove);
router.delete("/user/:userId/clear", selfOrAdmin, clear);

export default router;
