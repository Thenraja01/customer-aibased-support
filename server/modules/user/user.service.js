import User from "./user.schema.js";
import Organization from "../organization/organization.schema.js";
import Branch from "../branch/branch.schema.js";
import mongoose from "mongoose";
import bcrypt from "bcrypt";
import { escapeRegex } from "../../utils/escapeRegex.js";
import { normalizeRoleName, isSuperAdmin, ROLE_LEVELS } from "../../utils/constants.js";

// ── Role hierarchy for creation validation ───────────────────────────

const ALLOWED_ROLES = ["super_admin", "admin", "branch_admin", "support", "customer"];

// Branch-scoped roles must belong to exactly one branch.
const BRANCH_REQUIRED_ROLES = ["branch_admin", "support", "customer"];

const normalizeRole = (roleName) =>
  String(roleName || "")
    .toLowerCase()
    .replace(/\s+/g, "_");

/**
 * Enforce the organization → branch → role invariant:
 *   - branch_admin / support / customer MUST be assigned a branch
 *   - admin / super_admin are org-level and must NOT be assigned a branch
 *   - any assigned branch must belong to the target organization
 * Returns the normalized role.
 */
const assertRoleBranchValid = async ({ role, branch_id, organization_id }) => {
  const normalized = normalizeRole(role);
  if (!ALLOWED_ROLES.includes(normalized)) {
    throw new Error(`Invalid role: ${role}`);
  }

  if (normalized === "admin" || normalized === "super_admin") {
    if (branch_id) {
      throw new Error(`Forbidden: ${normalized} is an organization-level role and cannot be assigned to a branch`);
    }
    return normalized;
  }

  if (!branch_id) {
    throw new Error(`A branch is required for ${normalized} users`);
  }

  const branch = await Branch.findOne({ _id: branch_id, organization_id })
    .select("_id")
    .lean();
  if (!branch) {
    throw new Error("Forbidden: Branch does not belong to this organization");
  }

  return normalized;
};

// ── Scope-aware queries ──────────────────────────────────────────────

/**
 * Get all users, filtered by the caller's scope.
 * @param {Object} scope  req.scope from attachScope middleware
 */
export const getAllUsers = async (scope = null) => {
  const filter = {};

  if (scope && !scope.isSuperAdmin) {
    // Always filter by org
    filter.organization_id = scope.organizationId;

    // Branch-scoped roles can only see users in their branch
    if (!scope.isOrgAdmin && scope.branchId) {
      filter.branch_id = scope.branchId;
    }
  }

  const users = await User.find(filter)
    .populate("organization_id", "name email")
    .populate("branch_id", "name code")
    .select("-password");
  return users.map((u) => ({ ...u.toObject(), roleName: u.role }));
};

export const getOrgCustomers = async (organizationId, branchId = null) => {
  const filter = { organization_id: organizationId, role: "customer" };
  if (branchId) filter.branch_id = branchId;

  const users = await User.find(filter)
    .select("-password")
    .sort({ created_at: -1 });
  return users.map((u) => ({ ...u.toObject(), roleName: u.role }));
};

export const getUserById = async (id) => {
  const user = await User.findById(id)
    .populate("organization_id", "name email")
    .populate("branch_id", "name code")
    .select("-password");
  if (!user) throw new Error("User not found");
  return { ...user.toObject(), roleName: user.role };
};

// ── Scope-enforced user creation ─────────────────────────────────────
/**
 * Create a user with scope enforcement.
 *
 * @param {Object} userData   User data from the request body
 * @param {Object} creator    The authenticated user creating this user (req.user)
 */
export const createUser = async (userData, creator = null) => {
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) throw new Error("Email already exists");

  const organization = await Organization.findById(userData.organization_id);
  if (!organization) throw new Error("Organization not found");

  const roleName = normalizeRole(userData.role);
  if (!ALLOWED_ROLES.includes(roleName)) {
    throw new Error(`Invalid role: ${userData.role}`);
  }

  // ── Scope enforcement when a creator is present ────────────
  if (creator) {
    const creatorRole = normalizeRoleName(creator.roleName || creator.role);
    const creatorLevel = ROLE_LEVELS[creatorRole] ?? 99;
    const targetLevel = ROLE_LEVELS[roleName] ?? 99;

    // 1. Role hierarchy: prevent assigning roles at or above creator's privilege level
    // (lower number = higher privilege, so targetLevel must be STRICTLY GREATER than creatorLevel)
    if (!isSuperAdmin(creatorRole) && targetLevel <= creatorLevel) {
      throw new Error(`Forbidden: You cannot create a user with equal or higher privilege (${roleName})`);
    }

    // 2. Organization scope: non-super-admins can only create within their org
    if (!isSuperAdmin(creatorRole)) {
      const creatorOrgId = creator.organizationId?.toString();
      if (creatorOrgId && creatorOrgId !== organization._id.toString()) {
        throw new Error("Forbidden: Cannot create users in another organization");
      }
    }

    // 3. Branch scope: branch_admin can only create within their branch
    if (creatorRole === "branch_admin") {
      const creatorBranchId = creator.branchId?.toString();
      if (userData.branch_id && creatorBranchId && userData.branch_id.toString() !== creatorBranchId) {
        throw new Error("Forbidden: Branch admins can only create users in their own branch");
      }
      // Auto-set branch if not provided
      if (!userData.branch_id && creatorBranchId) {
        userData.branch_id = creatorBranchId;
      }
    }
  }

  // ── Organization → branch → role invariant ───────────────
  const validatedRole = await assertRoleBranchValid({
    role: roleName,
    branch_id: userData.branch_id || null,
    organization_id: organization._id,
  });

  const hashedPassword = await bcrypt.hash(userData.password, 10);
  const user = await User.create({
    ...userData,
    role: validatedRole,
    password: hashedPassword,
    created_by: creator?.userId || creator?._id || null,
  });

  const { password: _, ...safeUser } = user.toObject();
  return { ...safeUser, roleName: validatedRole };
};

// ── Scope-enforced user update ───────────────────────────────────────

export const updateUser = async (id, userData, scope = null) => {
  // Scope check: can only update users in own org/branch
  if (scope && !scope.isSuperAdmin) {
    const targetUser = await User.findById(id).select("organization_id branch_id role").lean();
    if (!targetUser) throw new Error("User not found");

    if (targetUser.organization_id.toString() !== scope.organizationId) {
      throw new Error("Forbidden: Cannot update users in another organization");
    }

    if (!scope.isOrgAdmin && scope.branchId) {
      if (targetUser.branch_id?.toString() !== scope.branchId) {
        throw new Error("Forbidden: Cannot update users in another branch");
      }
    }
  }

  const allowed = { name: 1, email: 1, phone: 1, status: 1, organization_id: 1, branch_id: 1, role: 1 };
  const filtered = {};
  for (const key of Object.keys(userData)) {
    if (allowed[key] !== undefined) filtered[key] = userData[key];
  }
  if (filtered.role) {
    const roleName = normalizeRole(filtered.role);
    if (!ALLOWED_ROLES.includes(roleName)) {
      throw new Error(`Invalid role: ${filtered.role}`);
    }
    filtered.role = roleName;
  }
  
  delete filtered.password;

  // ── Organization → branch → role invariant ───────────────
  // Re-validate whenever role or branch is being changed. The target user's
  // organization is authoritative (org cannot be moved across tenants here).
  if (filtered.role || filtered.branch_id !== undefined) {
    const targetUser = await User.findById(id).select("organization_id branch_id role").lean();
    if (!targetUser) throw new Error("User not found");

    const effectiveRole = normalizeRole(filtered.role || targetUser.role);

    // Org-level roles are never branch-scoped — promoting clears the branch.
    const effectiveBranch =
      effectiveRole === "admin" || effectiveRole === "super_admin"
        ? null
        : filtered.branch_id !== undefined
        ? filtered.branch_id
        : targetUser.branch_id;

    const validatedRole = await assertRoleBranchValid({
      role: effectiveRole,
      branch_id: effectiveBranch || null,
      organization_id: targetUser.organization_id,
    });

    filtered.role = validatedRole;
    if (effectiveRole === "admin" || effectiveRole === "super_admin") {
      filtered.branch_id = null;
    }
  }

  const user = await User.findByIdAndUpdate(id, filtered, {
    new: true,
    runValidators: true,
  })
    .populate("organization_id", "name email")
    .populate("branch_id", "name code")
    .select("-password");
  if (!user) throw new Error("User not found");
  return { ...user.toObject(), roleName: user.role };
};

export const updateUserStatus = async (id, status, scope = null) => {
  const allowed = ["active", "inactive", "blocked", "pending", "approved"];
  if (!allowed.includes(status)) throw new Error("Invalid status value");

  // Scope check: can only toggle users in own org/branch
  if (scope && !scope.isSuperAdmin) {
    const targetUser = await User.findById(id).select("organization_id branch_id role").lean();
    if (!targetUser) throw new Error("User not found");

    if (targetUser.organization_id.toString() !== scope.organizationId) {
      throw new Error("Forbidden: Cannot update users in another organization");
    }

    // Cannot block/unblock someone with equal or higher privilege
    const targetLevel = ROLE_LEVELS[targetUser.role] ?? 99;
    const callerLevel = ROLE_LEVELS[scope.role] ?? 99;
    if (targetLevel <= callerLevel) {
      throw new Error("Forbidden: Cannot change the status of a user with equal or higher privilege");
    }

    if (!scope.isOrgAdmin && scope.branchId) {
      if (targetUser.branch_id?.toString() !== scope.branchId) {
        throw new Error("Forbidden: Cannot update users in another branch");
      }
    }
  }

  const user = await User.findByIdAndUpdate(id, { status }, { new: true }).select(
    "-password"
  );
  if (!user) throw new Error("User not found");
  return user;
};

export const deleteUser = async (id, scope = null) => {
  // Scope check
  if (scope && !scope.isSuperAdmin) {
    const targetUser = await User.findById(id).select("organization_id branch_id role").lean();
    if (!targetUser) throw new Error("User not found");

    if (targetUser.organization_id.toString() !== scope.organizationId) {
      throw new Error("Forbidden: Cannot delete users in another organization");
    }

    // Cannot delete someone with higher privilege
    const targetLevel = ROLE_LEVELS[targetUser.role] ?? 99;
    const callerLevel = ROLE_LEVELS[scope.role] ?? 99;
    if (targetLevel <= callerLevel) {
      throw new Error("Forbidden: Cannot delete a user with equal or higher privilege");
    }
  }

  // Fetch user chats first to retrieve their IDs for message cleanup
  const Chat = mongoose.model("Chat");
  const deletedChats = await Chat.find({ user_id: id }).select("_id").lean();
  const deletedChatIds = deletedChats.map((c) => c._id);

  // Perform cascading cleanups in parallel
  await Promise.all([
    // Unassign open tickets assigned to the deleted user
    mongoose.model("Ticket").updateMany(
      { assigned_to: id, status: { $in: ["open", "in_progress"] } },
      { assigned_to: null }
    ),
    // Remove notifications for the deleted user
    mongoose.model("Notification").deleteMany({ user_id: id }),
    // Delete customer-authored chats
    Chat.deleteMany({ user_id: id }),
    // Delete chat messages in those chats
    mongoose.model("Message").deleteMany({ chat_id: { $in: deletedChatIds } }),
    // Delete individual messages sent by the deleted user
    mongoose.model("Message").deleteMany({ sender_id: id }),
    // Delete ticket messages (replies) sent by the deleted user
    mongoose.model("TicketMessage").deleteMany({ sender_id: id }),
  ]);

  const user = await User.findByIdAndDelete(id);
  if (!user) throw new Error("User not found");
  return { message: "User deleted successfully" };
};

export const searchUsers = async (keyword, scope = null) => {
  const safe = escapeRegex(keyword);
  const filter = {
    $or: [
      { name: { $regex: safe, $options: "i" } },
      { email: { $regex: safe, $options: "i" } },
    ],
  };

  // Scope filter
  if (scope && !scope.isSuperAdmin) {
    filter.organization_id = scope.organizationId;
    if (!scope.isOrgAdmin && scope.branchId) {
      filter.branch_id = scope.branchId;
    }
  }

  const users = await User.find(filter)
    .populate("organization_id", "name")
    .populate("branch_id", "name code")
    .select("-password");
  return users.map((u) => ({ ...u.toObject(), roleName: u.role || u.roleName }));
};

export const updateProfile = async (userId, profileData) => {
  const user = await User.findByIdAndUpdate(userId, profileData, {
    new: true,
    runValidators: true,
  })
    .populate("organization_id", "name email")
    .select("-password");
  if (!user) throw new Error("User not found");
  return { ...user.toObject(), roleName: user.role || user.roleName };
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
  if (!isPasswordValid) throw new Error("Current password is incorrect");

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) throw new Error("New password cannot be the same as current password");

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  return { message: "Password changed successfully" };
};

/**
 * Save (or replace) the FCM device token for a user.
 * The frontend should call POST /users/fcm-token after receiving a token
 * from the FCM SDK. Overwrites any previously stored token for the user
 * (single-device model). For multi-device support, switch fcm_token to
 * an array field and use $addToSet here instead.
 *
 * @param {string} userId - MongoDB ObjectId string of the user
 * @param {string} token  - FCM registration token from the client
 */
export const saveFcmToken = async (userId, token) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { fcm_token: token },
    { new: true }
  ).select("_id fcm_token");
  if (!user) throw new Error("User not found");
  return user;
};

/**
 * Clear the FCM token from the user document.
 * Called in two situations:
 *   1. Explicitly by the user (e.g. on logout via DELETE /users/fcm-token)
 *   2. Automatically by firebase.js when FCM reports the token as stale
 *
 * @param {string} userId - MongoDB ObjectId string of the user
 */
export const clearFcmToken = async (userId) => {
  await User.findByIdAndUpdate(userId, { $unset: { fcm_token: "" } });
  return { message: "FCM token cleared" };
};
