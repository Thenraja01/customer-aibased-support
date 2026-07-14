import express from "express";
import {
  create,
  getAll,
  search,
  getById,
  update,
  remove,
} from "../controller/organization.controller.js";
import { protect, restrict } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.post("/", restrict("admin"), create);
router.get("/", restrict("admin", "agent"), getAll);
router.get("/search", restrict("admin", "agent"), search);
router.get("/:id", getById);
router.put("/:id", restrict("admin"), update);
router.delete("/:id", restrict("admin"), remove);

export default router;
