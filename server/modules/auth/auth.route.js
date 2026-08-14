import express from "express";
import {
  register,
  login,
  changePassword,
  registerWithApproval,
  getPendingRegistrations,
  approveRegistration,
  checkUserStatus,
  buildAuthResponse,
  refreshTokens,
  logout,
} from "./auth.service.js";
import { getAuthUrl as getGoogleAuthUrl, verifyAuthorizationCode as verifyGoogleCode } from "./google.service.js";
import { getAuthUrl as getFacebookAuthUrl, verifyAuthorizationCode as verifyFacebookCode } from "./facebook.service.js";
import {
  handleOAuthIdentity,
  completeOAuthRegistration,
  issueOAuthState,
  consumeOAuthState,
} from "./oauth.service.js";
import env from "../../config/env.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  registerWithApprovalSchema,
  approveRegistrationSchema,
  requestOtpSchema,
  verifyOtpSchema,
  resetPasswordWithOtpSchema,
} from "../../validation/index.js";
import Organization from "../organization/organization.schema.js";
import User from "../user/user.schema.js";
import GlobalSetting from "../global-setting/globalSetting.schema.js";
import {
  generateOtp,
  verifyOtp,
  resetPasswordWithOtp,
  generateApprovalOtp,
  verifyApprovalOtp,
  getOtpStatus,
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

router.post("/v1/login", async (req, res) => {
  try {
    const result = await login(req.body, {
      ip: req.ip,
      userAgent: req.get("User-Agent") || "",
    });
    if (result.twoFactorRequired) {
      return res.status(200).json({ success: true, twoFactorRequired: true, email: result.email });
    }
    res.status(200).json({ success: true, message: result.message, token: result.token, refreshToken: result.refreshToken, data: result.user });
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

    console.error("Login error:", error);
    res.status(400).json({ success: false, message: userMessage, code, status: code });
  }
});

router.post("/v1/login/verify-2fa", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).populate("organization_id");
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    if (!user.otp || !user.otp_expiry) {
      return res.status(400).json({ success: false, message: "No 2FA verification requested or session expired." });
    }

    if (new Date() > user.otp_expiry) {
      user.otp = null;
      user.otp_expiry = null;
      await user.save();
      return res.status(400).json({ success: false, message: "OTP has expired. Please log in again." });
    }

    const bcrypt = await import("bcrypt");
    const isValid = await bcrypt.default.compare(otp, user.otp);
    if (!isValid) {
      return res.status(400).json({ success: false, message: "Invalid verification code" });
    }

    // Clear OTP
    user.otp = null;
    user.otp_expiry = null;
    await user.save();

    const auth = await buildAuthResponse(user, {
      ip: req.ip,
      userAgent: req.get("User-Agent") || "",
    });

    res.status(200).json({
      success: true,
      message: auth.message,
      token: auth.token,
      refreshToken: auth.refreshToken,
      data: auth.user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/v1/login/request-2fa", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    if (!user.two_factor_enabled) {
      return res.status(400).json({ success: false, message: "Two-factor authentication is not enabled for this account." });
    }

    const crypto = await import("crypto");
    const bcrypt = await import("bcrypt");
    const { sendEmail } = await import("../../utils/email.js");

    const otp = crypto.default.randomInt(100000, 999999).toString();
    const expiry = new Date(Date.now() + (env.OTP_EXPIRY_MINUTES || 10) * 60 * 1000);
    user.otp = await bcrypt.default.hash(otp, 10);
    user.otp_expiry = expiry;
    await user.save();

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1a2e;">Two-Factor Authentication</h2>
        <p>Your one-time verification code is:</p>
        <div style="background:#f0f4ff;border-radius:8px;padding:16px;text-align:center;margin:20px 0;">
          <span style="font-size:32px;font-weight:bold;color:#4f46e5;letter-spacing:8px;">${otp}</span>
        </div>
        <p style="color:#666;font-size:14px;">This code expires in ${env.OTP_EXPIRY_MINUTES || 10} minutes.</p>
      </div>
    `;

    await sendEmail({
      to: user.email,
      subject: "Your Two-Factor Authentication Code",
      html,
    });

    res.status(200).json({ success: true, message: `Verification code sent to ${user.email}` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /v1/refresh
 * Rotate a refresh token → new access token + rotated refresh token.
 * Body: { refreshToken }
 */
router.post("/v1/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) throw new Error("Refresh token is required");
    const result = await refreshTokens(refreshToken, {
      ip: req.ip,
      userAgent: req.get("User-Agent") || "",
    });
    res.status(200).json({
      success: true,
      message: result.message,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      user: result.user,
    });
  } catch (error) {
    res.status(401).json({ success: false, message: error.message });
  }
});

/**
 * POST /v1/logout
 * Revoke the refresh session(s). Body: { refreshToken } or { userId }.
 */
router.post("/v1/logout", async (req, res) => {
  try {
    const { refreshToken, userId } = req.body || {};
    const result = await logout({ refreshToken, userId });
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
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
 * Verifies OTP and sets user status to "active". On success the user is
 * signed in immediately (access + refresh tokens are returned).
 */
router.post("/v1/otp/verify-approval", async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: "Email and OTP are required" });
    await verifyApprovalOtp(email, otp);
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .populate("organization_id");
    if (!user) return res.status(404).json({ success: false, message: "Account not found" });
    const auth = await buildAuthResponse(user, {
      ip: req.ip,
      userAgent: req.get("User-Agent") || "",
    });
    res.status(200).json({
      success: true,
      message: auth.message,
      token: auth.token,
      refreshToken: auth.refreshToken,
      data: auth.user,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /v1/otp-status/:email
 * Returns the current OTP guard state for an email so the client can show
 * resend countdowns / lockouts and survive refreshes.
 */
router.get("/v1/otp-status/:email", async (req, res) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    const result = await getOtpStatus(decodeURIComponent(email));
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(404).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// Password Reset — Public endpoints
// ──────────────────────────────────────────────────────────────

/**
 * POST /v1/forgot-password
 * Sends a password-reset OTP to the user's email. Body: { email }
 */
router.post("/v1/forgot-password", validate(requestOtpSchema), async (req, res) => {
  try {
    const result = await generateOtp(req.body.email);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /v1/verify-reset-otp
 * Verifies a password-reset OTP. Body: { email, otp }
 */
router.post("/v1/verify-reset-otp", validate(verifyOtpSchema), async (req, res) => {
  try {
    const { email, otp } = req.body;
    await verifyOtp(email, otp);
    res.status(200).json({ success: true, message: "OTP verified. You may now set a new password." });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * POST /v1/reset-password
 * Resets the password using a verified OTP. Body: { email, otp, newPassword }
 */
router.post("/v1/reset-password", validate(resetPasswordWithOtpSchema), async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    await resetPasswordWithOtp(email, otp, newPassword);
    res.status(200).json({ success: true, message: "Password reset successfully. You can now sign in." });
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
  checkRole("admin", "branch_admin", "super_admin"),
  async (req, res) => {
    try {
      // Org admins only see their own org's pending registrations; Super Admin sees all
      const organizationId =
        req.user.roleName === "super_admin" ? null : req.user.organizationId;
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
  checkRole("admin", "branch_admin", "super_admin"),
  validate(approveRegistrationSchema),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { action, rejection_reason } = req.body;

      const callerOrgId =
        req.user.roleName === "super_admin" ? null : req.user.organizationId;
      const updatedUser = await approveRegistration(id, action, req.user.userId, rejection_reason, callerOrgId);

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
    const org = await Organization.findOne({ domain: domain.toLowerCase().trim() })
      .select("name domain address phone email logo brand_colors chart_colors show_charts chatbot_name default_language greeting_message organization_id")
      .lean();
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

// ──────────────────────────────────────────────────────────────
// OAuth Configuration Check
// ──────────────────────────────────────────────────────────────

router.get("/v1/oauth/providers", async (_req, res) => {
  try {
    const providers = {
      google: !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET,
      facebook: !!env.FACEBOOK_CLIENT_ID && !!env.FACEBOOK_CLIENT_SECRET,
    };
    res.status(200).json({ success: true, data: providers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// OAuth Callback Routes
// ──────────────────────────────────────────────────────────────

router.get("/v1/oauth/google/url", async (req, res) => {
  try {
    const { redirect_uri, code_challenge } = req.query;
    const state = await issueOAuthState("google");
    const authUrl = getGoogleAuthUrl({
      state,
      codeChallenge: code_challenge,
      redirectUri: redirect_uri || env.GOOGLE_CALLBACK_URL,
    });
    res.status(200).json({ success: true, data: { url: authUrl, state } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/v1/oauth/google/callback", async (req, res) => {
  try {
    const { code, state, code_verifier, redirect_uri } = req.body;

    const stateValid = await consumeOAuthState("google", state);
    if (!stateValid) {
      throw new Error("Invalid or expired OAuth state. Please try signing in again.");
    }

    const identity = await verifyGoogleCode({
      code,
      codeVerifier: code_verifier,
      redirectUri: redirect_uri || env.GOOGLE_CALLBACK_URL,
    });

    const result = await handleOAuthIdentity(identity, {
      ip: req.ip,
      userAgent: req.get("User-Agent") || "",
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.get("/v1/oauth/facebook/url", async (req, res) => {
  try {
    const { redirect_uri } = req.query;
    const state = await issueOAuthState("facebook");
    const authUrl = getFacebookAuthUrl({
      state,
      redirectUri: redirect_uri || env.FACEBOOK_CALLBACK_URL,
    });
    res.status(200).json({ success: true, data: { url: authUrl, state } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

router.post("/v1/oauth/facebook/callback", async (req, res) => {
  try {
    const { code, state, redirect_uri } = req.body;

    const stateValid = await consumeOAuthState("facebook", state);
    if (!stateValid) {
      throw new Error("Invalid or expired OAuth state. Please try signing in again.");
    }

    const identity = await verifyFacebookCode({
      code,
      redirectUri: redirect_uri || env.FACEBOOK_CALLBACK_URL,
    });

    const result = await handleOAuthIdentity(identity, {
      ip: req.ip,
      userAgent: req.get("User-Agent") || "",
    });

    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

// ──────────────────────────────────────────────────────────────
// OAuth Registration Completion
// ──────────────────────────────────────────────────────────────

/**
 * POST /v1/oauth/complete
 * Finish a new-user OAuth registration by selecting an org + requested role.
 * Body: { oauthToken, organization_id, requested_role }
 */
router.post("/v1/oauth/complete", async (req, res) => {
  try {
    const { oauthToken, organization_id, requested_role } = req.body;
    if (!oauthToken) {
      throw new Error("OAuth token is required");
    }
    const result = await completeOAuthRegistration({
      oauthToken,
      organization_id,
      requested_role,
    });
    res.status(201).json({ success: true, message: result.message, data: result.data });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

/**
 * GET /v1/roles/requestable/:orgId
 * Return roles that a new user may self-select for the given organization.
 * Excludes restricted roles (super_admin, admin, branch_admin).
 */
router.get("/v1/roles/requestable/:orgId", async (req, res) => {
  try {
    const { orgId } = req.params;
    const roles = await Role.find({
      $or: [{ organization_id: orgId }, { organization_id: null }],
    }).sort({ role_name: 1 }).select("role_name description");

    const requestable = roles.filter((r) => {
      const normalized = r.role_name.toLowerCase().replace(/[\s_]+/g, "");
      return !["superadmin", "tenantadmin", "admin"].includes(normalized);
    });

    res.status(200).json({ success: true, data: requestable });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
