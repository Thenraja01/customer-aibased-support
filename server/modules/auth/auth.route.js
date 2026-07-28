import express from "express";
import {
  register,
  login,
  changePassword,
  registerWithApproval,
  getPendingRegistrations,
  approveRegistration,
  checkUserStatus,
} from "./auth.service.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  registerWithApprovalSchema,
  approveRegistrationSchema,
} from "../../validation/index.js";
import Organization from "../organization/organization.schema.js";
import Role from "../role/role.schema.js";
import GlobalSetting from "../global-setting/globalSetting.schema.js";
import {
  generateApprovalOtp,
  verifyApprovalOtp,
} from "../user/otp.service.js";

const router = express.Router();

// ──────────────────────────────────────────────────────────────
// Standard Registration & Auth
// ──────────────────────────────────────────────────────────────

router.post("/v1/register", validate(registerSchema), async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(201).json({ success: true, message: result.message, data: result.user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/v1/login", validate(loginSchema), async (req, res) => {
  try {
    const result = await login(req.body);
    res.status(200).json({ success: true, message: result.message, token: result.token, data: result.user });
  } catch (error) {
    // Parse structured error codes from the login service
    const message = error.message;
    let code = null;
    let userMessage = message;

    if (message.startsWith("PENDING_APPROVAL:")) {
      code = "PENDING_APPROVAL";
      userMessage = message.replace("PENDING_APPROVAL: ", "");
    } else if (message.startsWith("OTP_REQUIRED:")) {
      code = "OTP_REQUIRED";
      userMessage = message.replace("OTP_REQUIRED: ", "");
    } else if (message.startsWith("ACCOUNT_REJECTED:")) {
      code = "ACCOUNT_REJECTED";
      userMessage = message.replace("ACCOUNT_REJECTED: ", "");
    }

    res.status(400).json({ success: false, message: userMessage, code });
  }
});

router.post("/v1/logout", protect, async (_req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
});

router.put("/v1/change-password", protect, validate(changePasswordSchema), async (req, res) => {
  try {
    const result = await changePassword(req.user.email, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// Admin Approval Workflow — Public endpoints
// ──────────────────────────────────────────────────────────────

/**
 * POST /v1/register-with-approval
 * Creates a user with status "pending". No login granted until approved + OTP verified.
 */
router.post("/v1/register-with-approval", validate(registerWithApprovalSchema), async (req, res) => {
  try {
    const result = await registerWithApproval(req.body);
    res.status(201).json({ success: true, message: result.message, data: result.user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /v1/check-user-status?email=
 * Returns the approval status of a user. Used by the RegistrationPending page.
 */
router.get("/v1/check-user-status", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    const result = await checkUserStatus(email);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

/**
 * POST /v1/otp/request-approval
 * Sends an OTP to an "approved" user's email for account activation.
 */
router.post("/v1/otp/request-approval", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    const result = await generateApprovalOtp(email);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /v1/otp/verify-approval
 * Verifies OTP and sets user status to "active", enabling login.
 */
router.post("/v1/otp/verify-approval", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });
    const result = await verifyApprovalOtp(email, otp);
    res.status(200).json({ success: true, message: result.message, data: { email: result.email } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// Admin Approval Workflow — Protected admin endpoints
// ──────────────────────────────────────────────────────────────

/**
 * GET /v1/pending-registrations
 * Returns all users with status "pending". Admin/Tenant Admin only.
 */
router.get(
  "/v1/pending-registrations",
  protect,
  restrict("super admin", "tenant admin", "admin"),
  async (req, res) => {
    try {
      // Org admins only see their own org's pending registrations
      const organizationId =
        req.user.roleName === "admin" ? req.user.organizationId : null;
      const users = await getPendingRegistrations(organizationId);
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
);

/**
 * POST /v1/approve-registration/:id
 * Approve or reject a pending user. On approval, sends OTP automatically.
 */
router.post(
  "/v1/approve-registration/:id",
  protect,
  restrict("super admin", "tenant admin", "admin"),
  validate(approveRegistrationSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action, rejection_reason } = req.body;

      const updatedUser = await approveRegistration(id, action, req.user.userId, rejection_reason);

      // Automatically send OTP email on approval
      if (action === "approve") {
        try {
          await generateApprovalOtp(updatedUser.email);
        } catch (otpError) {
          console.error("[ApproveRegistration] OTP send failed:", otpError.message);
          // Don't fail the approval if OTP email fails — admin can retry
          return res.status(200).json({
            success: true,
            message: "User approved, but OTP email failed to send. Please ask the user to resend OTP.",
            data: { userId: updatedUser._id, status: updatedUser.status, otpSent: false },
          });
        }
        return res.status(200).json({
          success: true,
          message: "User approved and OTP verification email sent.",
          data: { userId: updatedUser._id, status: updatedUser.status, otpSent: true },
        });
      }

      res.status(200).json({
        success: true,
        message: "User registration rejected.",
        data: { userId: updatedUser._id, status: updatedUser.status },
      });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
);

// ──────────────────────────────────────────────────────────────
// Reference Data (public)
// ──────────────────────────────────────────────────────────────

router.get("/v1/organizations", async (_req, res) => {
  try {
    const orgs = await Organization.find().sort({ name: 1 }).select("name organization_id");
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/organizations/by-domain", async (req, res) => {
  try {
    const { domain } = req.query;
    if (!domain) {
      return res.status(400).json({ success: false, message: "Domain query parameter is required" });
    }
    const org = await Organization.findOne({ domain: domain.toLowerCase().trim() }).lean();
    if (!org) {
      return res.status(404).json({ success: false, message: "Organization not found for this domain" });
    }
    res.status(200).json({ success: true, data: org });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/app-settings", async (_req, res) => {
  try {
    let settings = await GlobalSetting.findById("global").lean();
    if (!settings) {
      settings = await GlobalSetting.create({ _id: "global" });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/roles", async (_req, res) => {
  try {
    const roles = await Role.find().sort({ role_name: 1 }).select("role_name description");
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
