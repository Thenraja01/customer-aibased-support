import express from "express";
import {
  create,
  getAll,
  getById,
  update,
  remove,
} from "../controller/role.controller.js";
import { protect, restrict } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin"), create);
router.get("/", restrict("admin", "agent"), getAll);
router.get("/:id", restrict("admin", "agent"), getById);
router.put("/:id", restrict("admin"), update);
router.delete("/:id", restrict("admin"), remove);

export default router;
