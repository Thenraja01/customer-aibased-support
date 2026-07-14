import express from "express";
import {
  create,
  getActive,
  getAll,
  getById,
  update,
  remove,
} from "../controller/faq.controller.js";
import { protect, restrict } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

// Customer-facing
router.get("/active", getActive);

// Admin-facing CRUD
router.post("/", restrict("admin", "agent"), create);
router.get("/", restrict("admin", "agent"), getAll);
router.get("/:id", restrict("admin", "agent"), getById);
router.put("/:id", restrict("admin", "agent"), update);
router.delete("/:id", restrict("admin"), remove);

export default router;
