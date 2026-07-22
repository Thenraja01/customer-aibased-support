import express from "express";
import * as userController from "./user.controller.js";
import { protect, restrict, selfOrAdmin } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createUserSchema, updateUserSchema, updateUserStatusSchema, updateProfileSchema, userPasswordSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.get("/search", restrict("super admin", "tenant admin", "admin", "support"), userController.searchUser);
router.get("/", restrict("super admin", "tenant admin", "admin", "support"), userController.getUsers);
router.get("/profile", userController.getProfile);
router.get("/:id", selfOrAdmin, userController.getUser);
router.post("/", restrict("super admin", "tenant admin", "admin"), validate(createUserSchema), userController.addUser);
router.put("/profile", validate(updateProfileSchema), userController.updateProfile);
router.put("/password", validate(userPasswordSchema), userController.changePassword);
router.put("/:id", restrict("super admin", "tenant admin", "admin"), validate(updateUserSchema), userController.editUser);
router.patch("/:id/status", restrict("super admin", "tenant admin", "admin"), validate(updateUserStatusSchema), userController.patchUserStatus);
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), userController.removeUser);

export default router;
