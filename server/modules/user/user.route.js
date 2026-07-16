import express from "express";
import * as userController from "./user.controller.js";
import { protect, restrict, selfOrAdmin } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createUserSchema, updateUserSchema, updateUserStatusSchema, updateProfileSchema, userPasswordSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.get("/search", restrict("admin", "agent"), userController.searchUser);
router.get("/", restrict("admin", "agent"), userController.getUsers);
router.get("/profile", userController.getProfile);
router.get("/:id", selfOrAdmin, userController.getUser);
router.post("/", restrict("admin"), validate(createUserSchema), userController.addUser);
router.put("/profile", validate(updateProfileSchema), userController.updateProfile);
router.put("/password", validate(userPasswordSchema), userController.changePassword);
router.put("/:id", restrict("admin"), validate(updateUserSchema), userController.editUser);
router.patch("/:id/status", restrict("admin"), validate(updateUserStatusSchema), userController.patchUserStatus);
router.delete("/:id", restrict("admin"), userController.removeUser);

export default router;
