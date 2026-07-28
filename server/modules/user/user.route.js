import express from "express";
import * as userController from "./user.controller.js";
import * as otpController from "./otp.controller.js";
import { protect, restrict, selfOrAdmin } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createUserSchema, updateUserSchema, updateUserStatusSchema, updateProfileSchema, userPasswordSchema, requestOtpSchema, verifyOtpSchema, resetPasswordWithOtpSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.get("/search", restrict("super admin", "tenant admin", "admin", "support"), userController.searchUser);
router.get("/", restrict("super admin", "tenant admin", "admin", "support"), userController.getUsers);
router.get("/profile", userController.getProfile);
router.get("/:id", selfOrAdmin, userController.getUser);
router.post("/", restrict("super admin", "tenant admin", "admin"), validate(createUserSchema), userController.addUser);
router.put("/profile", validate(updateProfileSchema), userController.updateProfile);
router.put("/password", validate(userPasswordSchema), userController.changePassword);

// FCM device token management — authenticated user manages their own token
router.post("/fcm-token", userController.updateFcmToken);
router.delete("/fcm-token", userController.removeFcmToken);

router.post("/otp/request", validate(requestOtpSchema), otpController.requestOtp);
router.post("/otp/verify", validate(verifyOtpSchema), otpController.verifyOtp);
router.post("/otp/reset-password", validate(resetPasswordWithOtpSchema), otpController.resetPassword);
router.put("/:id", restrict("super admin", "tenant admin", "admin"), validate(updateUserSchema), userController.editUser);
router.patch("/:id/status", restrict("super admin", "tenant admin", "admin"), validate(updateUserStatusSchema), userController.patchUserStatus);
router.delete("/:id", restrict("super admin", "tenant admin", "admin"), userController.removeUser);

export default router;
