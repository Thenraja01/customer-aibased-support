import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { register, login, changePassword, generateUIConfig } from "./auth.service.js";
import Organization from "../organization/organization.schema.js";
import Role from "../role/role.schema.js";
import User from "../user/user.schema.js";
import env from "../../config/env.js";

export const registerUser = async (req, res) => {
  try {
    const result = await register(req.body);
    res.status(201).json({ success: true, message: result.message, data: result.user });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const result = await login(req.body);
    res.status(200).json({ 
      success: true, 
      message: result.message, 
      access_token: result.access_token, 
      data: result.user,
      ui_config: result.ui_config
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const registerOrganization = async (req, res) => {
  try {
    const { name, email, phone, address, organization_id } = req.body;
    if (!name || !email) {
      return res.status(400).json({ success: false, message: "Name and email are required" });
    }
    const org = await Organization.create({
      name, email, phone, address,
      organization_id: organization_id || name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      approval_status: "pending", registration_type: "self_registered", status: "inactive",
    });
    res.status(201).json({ success: true, message: "Organization registration submitted for approval", data: { id: org._id, name: org.name } });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const logoutUser = async (_req, res) => {
  res.status(200).json({ success: true, message: "Logged out successfully" });
};

export const updatePassword = async (req, res) => {
  try {
    const result = await changePassword(req.user.userId, req.body.currentPassword, req.body.newPassword);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const listOrganizations = async (_req, res) => {
  try {
    const orgs = await Organization.find({ status: "active", is_deleted: { $ne: true } })
      .sort({ name: 1 }).select("name organization_id");
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const listRoles = async (_req, res) => {
  try {
    const roles = await Role.find().sort({ role_name: 1 }).select("role_name");
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: "Refresh token required" });
    const decoded = jwt.verify(refreshToken, env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate("organization_id role_id");
    if (!user || user.status !== "active") return res.status(401).json({ success: false, message: "User not found or inactive" });
    const token = jwt.sign(
      { userId: user._id, organizationId: user.organization_id?._id, roleId: user.role_id?._id, roleName: user.role_id?.role_name, email: user.email },
      env.JWT_SECRET, { expiresIn: "1d" }
    );
    res.status(200).json({ success: true, accessToken: token, data: user });
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });
    const user = await User.findOne({ email, is_deleted: { $ne: true } });
    if (!user) return res.status(200).json({ success: true, message: "If the email exists, a reset link has been sent" });
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.reset_password_token = resetToken;
    user.reset_password_expires = Date.now() + 3600000;
    await user.save();
    console.log(`[Auth] Password reset token for ${email}: ${resetToken}`);
    res.status(200).json({ success: true, message: "If the email exists, a reset link has been sent" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ success: false, message: "Token and new password required" });
    const user = await User.findOne({
      reset_password_token: token, reset_password_expires: { $gt: Date.now() }, is_deleted: { $ne: true },
    });
    if (!user) return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
    user.password = await bcrypt.hash(newPassword, 10);
    user.reset_password_token = undefined;
    user.reset_password_expires = undefined;
    await user.save();
    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone number required" });
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[Auth] OTP for ${phone}: ${otp}`);
    res.status(200).json({ success: true, message: "OTP sent successfully", otp });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: "Phone and OTP required" });
    res.status(200).json({ success: true, message: "OTP verified successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getUIConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .populate("organization_id")
      .populate("role_id");
    
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    
    const ui_config = generateUIConfig(user, user.organization_id);
    res.status(200).json({ success: true, data: ui_config });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
