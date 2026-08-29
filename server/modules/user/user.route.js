import express from "express";
import * as userController from "./user.controller.js";
import * as otpController from "./otp.controller.js";
import { protect, selfOrAdmin } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { enforceBranchScope, attachScope } from "../../middleware/branchScope.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createUserSchema, updateUserSchema, updateUserStatusSchema, updateProfileSchema, userPasswordSchema, requestOtpSchema, verifyOtpSchema, resetPasswordWithOtpSchema } from "../../validation/index.js";
import { uploadAvatar, handleUpload } from "../../middleware/upload.middleware.js";

// RBAC: super_admin always passes; admin manages org users; branch_admin manages branch users.
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);

// Attach scope context (org/branch/role) for downstream service use
router.use(attachScope);

router.get("/search", checkRole(...ADMIN), userController.searchUser);
router.get("/customers", checkRole("admin", "branch_admin", "support"), userController.getOrgCustomers);
router.get("/", checkRole(...ADMIN), userController.getUsers);
router.get("/profile", userController.getProfile);
router.get("/:id", selfOrAdmin, userController.getUser);

// User creation: role gate + branch scope enforcement
router.post("/", checkRole(...ADMIN), enforceBranchScope(), validate(createUserSchema), userController.addUser);

router.put("/profile", validate(updateProfileSchema), userController.updateProfile);
router.put("/profile/avatar", handleUpload(uploadAvatar), userController.updateAvatar);
router.post("/profile/2fa/enable", userController.enable2FA);
router.post("/profile/2fa/disable", userController.disable2FA);
router.put("/password", validate(userPasswordSchema), userController.changePassword);

// FCM device token management — authenticated user manages their own token
router.post("/fcm-token", userController.updateFcmToken);
router.delete("/fcm-token", userController.removeFcmToken);

router.post("/otp/request", validate(requestOtpSchema), otpController.requestOtp);
router.post("/otp/verify", validate(verifyOtpSchema), otpController.verifyOtp);
router.post("/otp/reset-password", validate(resetPasswordWithOtpSchema), otpController.resetPassword);
router.put("/:id", checkRole(...ADMIN), validate(updateUserSchema), userController.editUser);
router.patch("/:id/status", checkRole(...ADMIN), validate(updateUserStatusSchema), userController.patchUserStatus);
router.delete("/:id", checkRole("admin"), userController.removeUser);

export default router;
