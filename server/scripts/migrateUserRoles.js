/**
 * One-time migration to the multi-role model (UserRole join collection).
 *
 * For every user that still has a legacy `role_id`:
 *   1. Create a UserRole row in that user's organization.
 *   2. Normalize legacy status values:
 *        approved  → active   (approved users can log in)
 *        inactive  → disabled
 *        blocked   → rejected
 *   3. Ensure the standard roles exist (Admin / Support / Customer / super admin).
 *
 * Idempotent — safe to re-run.
 *
 * Usage:  node scripts/migrateUserRoles.js
 */
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
dotenv.config();

import Role from "../modules/role/role.schema.js";
import Organization from "../modules/organization/organization.schema.js";
import User from "../modules/user/user.schema.js";
import UserRole from "../modules/user-role/userRole.schema.js";
import { DEFAULT_ROLE_PERMISSIONS, ROLE_KEYS } from "../utils/permissions.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/supportai";

const STATUS_MAP = { approved: "active", inactive: "disabled", blocked: "rejected" };

const ensureRoles = async () => {
  const roles = {};
  const roleRows = [
    { role_name: ROLE_KEYS.SUPER_ADMIN, permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_KEYS.SUPER_ADMIN], description: "Super administrator with full system access" },
    { role_name: ROLE_KEYS.ADMIN, permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_KEYS.ADMIN], description: "Organization admin with management permissions" },
    { role_name: ROLE_KEYS.SUPPORT, permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_KEYS.SUPPORT], description: "Support agent with ticket and chat access" },
    { role_name: ROLE_KEYS.CUSTOMER, permissions: DEFAULT_ROLE_PERMISSIONS[ROLE_KEYS.CUSTOMER], description: "Regular customer with ticket access" },
  ];
  for (const row of roleRows) {
    const role = await Role.findOneAndUpdate(
      { role_name: row.role_name, organization_id: null },
      { $setOnInsert: row },
      { upsert: true, new: true }
    );
    roles[row.role_name.toLowerCase()] = role;
  }
  return roles;
};

const migrate = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const roles = await ensureRoles();
  const roleIdByLowerName = {};
  for (const [key, role] of Object.entries(roles)) roleIdByLowerName[key] = role._id;

  const users = await User.find({ role_id: { $ne: null } });
  let assigned = 0;
  let statusFixed = 0;
  let roleMissing = 0;

  for (const user of users) {
    // Normalize status
    if (STATUS_MAP[user.status]) {
      user.status = STATUS_MAP[user.status];
      statusFixed++;
    }

    // Create UserRole
    const existing = await UserRole.findOne({
      user_id: user._id,
      role_id: user.role_id,
      organization_id: user.organization_id,
    });
    if (!existing && user.organization_id) {
      await UserRole.create({
        user_id: user._id,
        role_id: user.role_id,
        organization_id: user.organization_id,
        assigned_by: null,
      });
      assigned++;
    }

    if (user.status === "active" && user.organization_id) {
      const hasAnyRole = await UserRole.exists({ user_id: user._id });
      if (!hasAnyRole) {
        // Give active users without a role a sensible default (Customer).
        const fallback = await Role.findOne({ role_name: ROLE_KEYS.CUSTOMER, organization_id: null });
        if (fallback) {
          await UserRole.create({
            user_id: user._id,
            role_id: fallback._id,
            organization_id: user.organization_id,
            assigned_by: null,
          });
          roleMissing++;
        }
      }
    }

    await user.save();
  }

  console.log(`UserRole rows created: ${assigned}`);
  console.log(`Fallback roles assigned: ${roleMissing}`);
  console.log(`Status values normalized: ${statusFixed}`);
  console.log("Migration complete.");
  process.exit(0);
};

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
