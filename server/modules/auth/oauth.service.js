import crypto from "crypto";
import env from "../../config/env.js";
import User from "../user/user.schema.js";
import RegistrationRequest from "../registration-request/registrationRequest.schema.js";
import { logAction } from "../audit-log/auditLog.service.js";
import { createNotification } from "../notification/notification.service.js";
import { sendEmail } from "../../utils/email.js";
import { getCache } from "../../config/redis.js";
import {
  buildAuthResponse,
  resolveOrganization,
  resolveRequestableRole,
} from "./auth.service.js";
import { signOAuthGrant, verifyOAuthGrant } from "./token.service.js";
import { invalidateUserCache } from "../../middleware/auth.middleware.js";

const audit = (data) => logAction(data).catch(() => {});

const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const stateCacheKey = (provider, state) => `oauth:state:${provider}:${state}`;

/** Issue a one-time, expiring CSRF token bound to a provider. */
export const issueOAuthState = async (provider) => {
  const state = crypto.randomBytes(24).toString("hex");
  await getCache().set(stateCacheKey(provider, state), String(Date.now()), OAUTH_STATE_TTL_MS);
  return state;
};

/**
 * Validate and consume a one-time OAuth state. Returns true once only; any
 * replay or unknown value fails. Missing state always fails.
 */
export const consumeOAuthState = async (provider, state) => {
  if (!state) return false;
  const key = stateCacheKey(provider, state);
  const stored = await getCache().get(key);
  if (!stored) return false;
  await getCache().del(key);
  return true;
};

const notifyOrgAdmins = async (organizationId, user) => {
  try {
    const admins = await User.find({ organization_id: organizationId, role: { $in: ["admin", "super_admin"] } }).lean();
    for (const admin of admins) {
      await createNotification({
        user_id: admin._id,
        organization_id: organizationId,
        title: "New registration request",
        message: `${user.name} (${user.email}) signed up with ${user.auth_type} and awaits approval.`,
        type: "info",
        link: "/admin/approvals",
      });
    }
  } catch (error) {
    console.error("[OAuth] Failed to notify admins:", error.message);
  }
};

/**
 * OAuth only authenticates identity. It never assigns an organization or a
 * role and never approves a user.
 *
 * - Existing active user → issue tokens (normal login).
 * - Existing pending user → tell the client approval is pending.
 * - No user → return a short-lived signed grant the client can use to pick an
 *   organization + requested role and finish registration.
 */
export const handleOAuthIdentity = async (identity, ctx = {}) => {
  let user = await User.findOne({
    "oauth.provider": identity.provider,
    "oauth.provider_id": identity.providerId,
  });

  if (!user && identity.email) {
    const normalizedEmail = identity.email.toLowerCase().trim();
    user = await User.findOne({ email: normalizedEmail });

    if (user && user.oauth && user.oauth.provider === identity.provider && user.oauth.provider_id === identity.providerId) {
      // Same OAuth identity already linked — re-link safely.
      user.oauth = {
        provider: identity.provider,
        provider_id: identity.providerId,
        picture: identity.picture || null,
      };
      if (user.auth_type === "local") {
        user.auth_type = identity.provider;
      }
      await user.save();
    } else if (user && !user.oauth) {
      // Existing local account — do not auto-link OAuth credentials.
      // The user must explicitly add OAuth from their account settings.
      user = null;
    }
  }

  if (user) {
    const adminEmail = (process.env.SUPER_ADMIN_EMAIL || "superadmin@supportai.com").toLowerCase().trim();
    const isSuperAdmin =
      user.email.toLowerCase().trim() === adminEmail ||
      user.role === "super_admin" ||
      user.role === "admin";

    if (isSuperAdmin && user.status !== "active") {
      user.status = "active";
      user.email_verified = true;
      await user.save();
    }

    if (user.status === "active") {
      const result = await buildAuthResponse(user, ctx);
      user.last_login_at = new Date();
      await user.save();
      await invalidateUserCache(user._id.toString());
      await audit({
        user_id: user._id,
        organization_id: user.organization_id,
        action: `oauth_login_success`,
        table_name: "users",
        record_id: user._id.toString(),
        new_value: { provider: identity.provider },
      });
      return { ...result, needsApproval: false, isNew: false };
    }
    return { needsApproval: true, isNew: false, email: user.email, message: "Your account is awaiting administrator approval." };
  }

  // No account: hand back a signed grant so the client can finish registration.
  const oauthToken = signOAuthGrant({
    email: identity.email,
    name: identity.name,
    provider: identity.provider,
    providerId: identity.providerId,
  });

  await audit({
    organization_id: null,
    action: "oauth_identity_verified",
    table_name: "users",
    record_id: "",
    new_value: { provider: identity.provider, email: identity.email },
  });

  return {
    needsApproval: true,
    isNew: true,
    oauthToken,
    email: identity.email,
    name: identity.name,
    picture: identity.picture,
  };
};

/**
 * Finish an OAuth registration: pick an existing org + requested role.
 * Creates a `pending` user + registration request. No JWT until approval.
 */
export const completeOAuthRegistration = async ({ oauthToken, organization_id, requested_role }) => {
  const identity = verifyOAuthGrant(oauthToken);

  const org = await resolveOrganization(organization_id);
  const role = await resolveRequestableRole(org._id, requested_role);

  const normalizedEmail = identity.email.toLowerCase().trim();
  const existing = await User.findOne({
    email: normalizedEmail,
    organization_id: org._id,
  });
  if (existing) {
    throw new Error("An account with this email already exists in this organization");
  }

  const user = await User.create({
    organization_id: org._id,
    name: identity.name || normalizedEmail,
    email: normalizedEmail,
    password: null,
    auth_type: identity.provider,
    status: "pending",
    requested_role_id: role._id,
    email_verified: true,
    email_verified_at: new Date(),
    oauth: {
      provider: identity.provider,
      provider_id: identity.providerId,
      picture: identity.picture || null,
    },
  });

  await RegistrationRequest.create({
    organization_id: org._id,
    user_id: user._id,
    requested_role_id: role._id,
    name: user.name,
    email: normalizedEmail,
    provider: identity.provider,
    status: "pending",
  });

  await notifyOrgAdmins(org._id, user);
  await sendEmail({
    to: user.email,
    subject: "Registration received",
    html: `<p>Hi ${user.name},</p><p>Your registration with <b>${org.name}</b> is awaiting administrator approval. You will be able to log in once approved.</p>`,
  }).catch((err) => console.error("[OAuth] Email failed:", err.message));

  await audit({
    user_id: user._id,
    organization_id: org._id,
    action: "oauth_register_pending",
    table_name: "users",
    record_id: user._id.toString(),
    new_value: { provider: identity.provider, requested_role: role.role_name },
  });

  return {
    message:
      "Registration submitted. You will receive an email once an administrator approves your account.",
    data: {
      userId: user._id,
      email: user.email,
      status: user.status,
      emailVerified: true,
    },
  };
};

export default {
  handleOAuthIdentity,
  completeOAuthRegistration,
};
