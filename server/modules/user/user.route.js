import express from "express";
import * as userController from "./user.controller.js";
import { protect, restrict, selfOrAdmin } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createUserSchema, updateUserSchema, updateUserStatusSchema, updateProfileSchema, userPasswordSchema } from "../../validation/index.js";
import { uploadToMemory, handleUpload } from "../../middleware/upload.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/export", restrict("admin"), userController.exportUsers);
router.get("/search", restrict("admin", "support"), userController.searchUser);
router.get("/", restrict("admin", "support"), userController.getUsers);
router.get("/profile", userController.getProfile);
router.get("/activity", userController.getActivityLogs);
router.get("/:id", selfOrAdmin, userController.getUser);
router.post("/", restrict("admin"), validate(createUserSchema), userController.addUser);
router.post("/avatar", handleUpload(uploadToMemory), userController.uploadAvatar);
router.put("/profile", validate(updateProfileSchema), userController.updateProfile);
router.put("/password", validate(userPasswordSchema), userController.changePassword);
router.get("/pending", restrict("admin"), userController.getPendingUsers);
router.put("/:id", restrict("admin"), validate(updateUserSchema), userController.editUser);
router.patch("/:id/status", restrict("admin"), validate(updateUserStatusSchema), userController.patchUserStatus);
router.patch("/:id/approve", restrict("admin"), userController.approveUser);
router.patch("/:id/reject", restrict("admin"), userController.rejectUser);
router.delete("/:id", restrict("admin"), userController.removeUser);

export default router;
