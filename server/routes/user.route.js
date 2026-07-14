import express from "express";
import {
  getUsers,
  getUser,
  addUser,
  editUser,
  removeUser,
  searchUser,
  patchUserStatus,
} from "../controller/user.controller.js";
import { protect, restrict, selfOrAdmin } from "../middleware/auth.middleware.js";

const router = express.Router();


router.use(protect);

router.get("/search", restrict("admin", "agent"), searchUser);
router.get("/", restrict("admin", "agent"), getUsers);
router.get("/:id", selfOrAdmin, getUser);
router.post("/", restrict("admin"), addUser);
router.put("/:id", selfOrAdmin, editUser);
router.patch("/:id/status", restrict("admin"), patchUserStatus);
router.delete("/:id", restrict("admin"), removeUser);

export default router;
