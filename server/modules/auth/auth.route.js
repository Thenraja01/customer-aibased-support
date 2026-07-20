import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { registerSchema, loginSchema, changePasswordSchema } from "../../validation/index.js";
import * as authController from "./auth.controller.js";

const router = express.Router();

router.post("/v1/register", validate(registerSchema), authController.registerUser);
router.post("/v1/login", validate(loginSchema), authController.loginUser);
router.post("/v1/register-organization", authController.registerOrganization);
router.post("/v1/logout", protect, authController.logoutUser);
router.put("/v1/change-password", protect, validate(changePasswordSchema), authController.updatePassword);
router.get("/v1/organizations", authController.listOrganizations);
router.get("/v1/roles", authController.listRoles);
router.post("/v1/refresh", authController.refreshToken);
router.post("/v1/forgot-password", authController.forgotPassword);
router.post("/v1/reset-password", authController.resetPassword);
router.post("/v1/otp/send", authController.sendOtp);
router.post("/v1/otp/verify", authController.verifyOtp);
router.get("/v1/ui-config", protect, authController.getUIConfig);

export default router;
