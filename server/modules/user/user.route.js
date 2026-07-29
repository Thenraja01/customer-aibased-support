import express from "express";
import * as userController from "./user.controller.js";
import * as otpController from "./otp.controller.js";
import { protect, access, anyAccess, selfOrAdmin } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createUserSchema, updateUserSchema, updateUserStatusSchema, updateProfileSchema, userPasswordSchema, requestOtpSchema, verifyOtpSchema, resetPasswordWithOtpSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.get("/search", access("user.view"), userController.searchUser);
router.get("/", access("user.view"), userController.getUsers);
router.get("/profile", userController.getProfile);
router.get("/:id", selfOrAdmin, userController.getUser);
router.post("/", access("user.invite"), validate(createUserSchema), userController.addUser);
router.put("/profile", validate(updateProfileSchema), userController.updateProfile);
router.put("/password", validate(userPasswordSchema), userController.changePassword);

// FCM device token management — authenticated user manages their own token
router.post("/fcm-token", userController.updateFcmToken);
router.delete("/fcm-token", userController.removeFcmToken);

router.post("/otp/request", validate(requestOtpSchema), otpController.requestOtp);
router.post("/otp/verify", validate(verifyOtpSchema), otpController.verifyOtp);
router.post("/otp/reset-password", validate(resetPasswordWithOtpSchema), otpController.resetPassword);
router.put("/:id", anyAccess("user.update", "user.invite", "user.disable"), validate(updateUserSchema), userController.editUser);
router.patch("/:id/status", access("user.disable"), validate(updateUserStatusSchema), userController.patchUserStatus);
router.delete("/:id", anyAccess("user.update", "user.disable"), userController.removeUser);

export default router;
