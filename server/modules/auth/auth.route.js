import express from "express";
import { register, login, changePassword } from "./auth.service.js";
import { protect } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { registerSchema, loginSchema, changePasswordSchema } from "../../validation/index.js";
import Organization from "../organization/organization.schema.js";
import Role from "../role/role.schema.js";

const router = express.Router();

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
    res.status(400).json({ success: false, message: error.message });
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

router.get("/v1/organizations", async (_req, res) => {
  try {
    const orgs = await Organization.find().sort({ name: 1 }).select("name organization_id");
    res.status(200).json({ success: true, data: orgs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/roles", async (_req, res) => {
  try {
    const roles = await Role.find().sort({ role_name: 1 }).select("role_name");
    res.status(200).json({ success: true, data: roles });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
