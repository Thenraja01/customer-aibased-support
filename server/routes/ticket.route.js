import express from "express";
import {
  create,
  getAll,
  getStats,
  getById,
  getByUser,
  getByAgent,
  getByStatus,
  assign,
  changePriority,
  resolve,
  close,
  remove,
} from "../controller/ticket.controller.js";
import { protect, restrict, selfOrAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", create);
router.get("/", restrict("admin", "agent"), getAll);
router.get("/stats", restrict("admin", "agent"), getStats);
router.get("/:id", getById);
router.get("/user/:userId", selfOrAdmin, getByUser);
router.get("/agent/:agentId", restrict("admin", "agent"), getByAgent); // Usually selfOrAdmin for agents
router.get("/status/:status", restrict("admin", "agent"), getByStatus);
router.patch("/:id/assign", restrict("admin", "agent"), assign);
router.patch("/:id/priority", restrict("admin", "agent"), changePriority);
router.patch("/:id/resolve", restrict("admin", "agent"), resolve);
router.patch("/:id/close", close);
router.delete("/:id", restrict("admin"), remove);

export default router;
