import crypto from "crypto";
import User from "../user/user.schema.js";
import { sendEmail } from "../../utils/email.js";
import bcrypt from "bcrypt";
import env from "../../config/env.js";

/**
 * Generate an OTP for password change.
 * Requires the user to already be "active".
 */
export const generateOtp = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("No account found with this email");
  if (user.status !== "active") throw new Error("Account is not active");

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);
  user.otp = await bcrypt.hash(otp, 10);
  user.otp_expiry = expiry;
  await user.save();

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:20px;">
      <h2 style="color:#1a1a2e;">Password Change Verification</h2>
      <p>Your one-time password (OTP) for password change is:</p>
      <div style="background:#f0f4ff;border-radius:8px;padding:16px;text-align:center;margin:20px 0;">
        <span style="font-size:32px;font-weight:bold;color:#4f46e5;letter-spacing:8px;">${otp}</span>
      </div>
      <p style="color:#666;font-size:14px;">This OTP expires in ${env.OTP_EXPIRY_MINUTES} minutes.</p>
      <p style="color:#666;font-size:14px;">If you didn't request this, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: "Your OTP for Password Change",
    html,
    organizationId: user.organization_id,
    branchId: user.branch_id,
  });

  return { message: `OTP sent to ${user.email}`, email: user.email};
};

export const verifyOtp = async (email, otp) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("No account found with this email");
  if (!user.otp || !user.otp_expiry) throw new Error("No OTP requested. Please request a new one.");
  if (new Date() > user.otp_expiry) {
    user.otp = null;
    user.otp_expiry = null;
    await user.save();
    throw new Error("OTP has expired. Please request a new one.");
  }

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) throw new Error("Invalid OTP");

  user.otp = null;
  user.otp_expiry = null;
  await user.save();

  return { message: "OTP verified successfully" };
};

export const resetPasswordWithOtp = async (email, otp, newPassword) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("No account found with this email");
  if (!user.otp || !user.otp_expiry) throw new Error("No OTP verified. Please verify OTP first.");
  if (new Date() > user.otp_expiry) {
    user.otp = null;
    user.otp_expiry = null;
    await user.save();
    throw new Error("OTP has expired. Please request a new one.");
  }

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) throw new Error("Invalid OTP");

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) throw new Error("New password cannot be the same as current password");

  user.password = await bcrypt.hash(newPassword, 10);
  user.otp = null;
  user.otp_expiry = null;
  await user.save();

  return { message: "Password changed successfully" };
};

/**
 * Generate an OTP for account activation after admin approval.
 * Works for users with status "approved" (not requiring "active").
 */
export const generateApprovalOtp = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("No account found with this email");

  if (user.status !== "approved") {
    if (user.status === "pending") {
      throw new Error("Your account is still awaiting admin approval.");
    }
    if (user.status === "active") {
      throw new Error("Your account is already verified. Please login.");
    }
    if (user.status === "blocked") {
      throw new Error("Your account has been rejected. Please contact support.");
    }
    throw new Error("Account is not eligible for OTP verification.");
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const expiry = new Date(Date.now() + env.OTP_EXPIRY_MINUTES * 60 * 1000);

  user.otp = await bcrypt.hash(otp, 10);
  user.otp_expiry = expiry;
  await user.save();

  console.log("\n" + "=".repeat(50));
  console.log(`🔑 [APPROVAL OTP GENERATED]`);
  console.log(`   User  : ${user.name} (${user.email})`);
  console.log(`   OTP   : ${otp}`);
  console.log(`   Expiry: ${env.OTP_EXPIRY_MINUTES} minutes`);
  console.log("=".repeat(50) + "\n");

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#fafafa;border-radius:12px;">
      <div style="text-align:center;margin-bottom:24px;">
        <div style="width:64px;height:64px;background:linear-gradient(135deg,#4f46e5,#7c3aed);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
          <span style="color:white;font-size:28px;">✓</span>
        </div>
        <h2 style="color:#1a1a2e;margin:0;">Account Approved!</h2>
      </div>
      <p style="color:#374151;">Hi <strong>${user.name}</strong>,</p>
      <p style="color:#374151;">Great news! Your registration has been reviewed and approved by the administrator.</p>
      <p style="color:#374151;">Please use the following OTP to verify your account and complete registration:</p>
      <div style="background:#f0f4ff;border:2px solid #4f46e5;border-radius:12px;padding:20px;text-align:center;margin:24px 0;">
        <p style="color:#6b7280;font-size:13px;margin:0 0 8px 0;">Your One-Time Password</p>
        <span style="font-size:36px;font-weight:bold;color:#4f46e5;letter-spacing:10px;">${otp}</span>
        <p style="color:#6b7280;font-size:12px;margin:8px 0 0 0;">Expires in ${env.OTP_EXPIRY_MINUTES} minutes</p>
      </div>
      <p style="color:#374151;">Once verified, you can login to your account using your registered email and password.</p>
      <p style="color:#9ca3af;font-size:12px;">If you didn't create an account, please ignore this email.</p>
    </div>
  `;

  await sendEmail({
    to: user.email,
    subject: "🎉 Account Approved — Verify Your OTP",
    html,
    organizationId: user.organization_id,
    branchId: user.branch_id,
  });

  return { message: `Verification OTP sent to ${user.email}`, email: user.email };
};

/**
 * Verify OTP for account activation.
 * On success, sets user status to "active" so they can login.
 */
export const verifyApprovalOtp = async (email, otp) => {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error("No account found with this email");

  if (user.status !== "approved") {
    if (user.status === "active") {
      throw new Error("Your account is already verified. Please login.");
    }
    throw new Error("Account is not eligible for OTP verification.");
  }

  if (!user.otp || !user.otp_expiry) {
    throw new Error("No OTP requested. Please request a new verification OTP.");
  }

  if (new Date() > user.otp_expiry) {
    user.otp = null;
    user.otp_expiry = null;
    await user.save();
    throw new Error("OTP has expired. Please request a new one.");
  }

  const isValid = await bcrypt.compare(otp, user.otp);
  if (!isValid) throw new Error("Invalid OTP. Please check and try again.");

  // Activate the user account
  user.status = "active";
  user.otp = null;
  user.otp_expiry = null;
  await user.save();

  return {
    message: "Account verified successfully! You can now login.",
    email: user.email,
  };
};

/**
 * Return the current OTP guard state for an email. Drives the client-side
 * resend countdown / lockout UI (see useOtpGuard). Attempts/lockout are not
 * tracked yet, so those fields report a neutral (unlocked) state.
 */
export const getOtpStatus = async (email) => {
  const user = await User.findOne({ email: email.toLowerCase() })
    .select("otp otp_expiry status")
    .lean();

  if (!user) throw new Error("No account found with this email");

  const now = Date.now();
  const hasActiveOtp = Boolean(
    user.otp && user.otp_expiry && new Date(user.otp_expiry) > now
  );

  return {
    has_active_otp: hasActiveOtp,
    otp_expires_in_seconds: hasActiveOtp
      ? Math.max(0, Math.floor((new Date(user.otp_expiry) - now) / 1000))
      : 0,
    resend_after_seconds: 0,
    locked: false,
    locked_seconds: 0,
    attempts_remaining: null,
  };
};
