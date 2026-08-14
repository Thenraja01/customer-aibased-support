import crypto from "crypto";
import jwt from "jsonwebtoken";
import env from "../../config/env.js";
import RefreshSession from "../refresh-session/refreshSession.schema.js";
export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

/**
 * Sign a short-lived access token. Payload follows the spec:
 * { userId, organizationId, branchId, roles, email }
 * Permissions are intentionally NOT embedded — they are loaded from cache/DB
 * so role changes take effect immediately. roleId/roleName are included so
 * lightweight middleware (protectSimple) can read them without a DB lookup.
 */
export const signAccessToken = ({ userId, organizationId, branchId, roles, roleId, roleName, email }) =>
  jwt.sign(
    { userId, organizationId, branchId, roles, roleId, roleName, email },
    env.JWT_SECRET,
    {
      issuer: env.JWT_ISSUER,
      audience: env.JWT_AUDIENCE,
      expiresIn: env.ACCESS_TOKEN_TTL,
    }
  );

export const verifyAccessToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, {
    issuer: env.JWT_ISSUER,
    audience: env.JWT_AUDIENCE,
  });

/** Short-lived signed token used for email verification links. */
export const signEmailVerifyToken = (email) =>
  jwt.sign(
    { email, purpose: "email-verify" },
    env.JWT_SECRET,
    { issuer: env.JWT_ISSUER, expiresIn: `${env.EMAIL_VERIFY_TTL_MINUTES}m` }
  );

export const verifyEmailVerifyToken = (token) => {
  const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: env.JWT_ISSUER });
  if (decoded.purpose !== "email-verify" || !decoded.email) {
    throw new Error("Invalid verification token");
  }
  return decoded;
};

/** Short-lived signed grant proving OAuth identity, used to finish registration. */
export const signOAuthGrant = ({ email, name, provider, providerId }) =>
  jwt.sign(
    { email, name, provider, providerId, purpose: "oauth-register" },
    env.JWT_SECRET,
    { issuer: env.JWT_ISSUER, expiresIn: `${env.OAUTH_GRANT_TTL_MINUTES}m` }
  );

export const verifyOAuthGrant = (token) => {
  const decoded = jwt.verify(token, env.JWT_SECRET, { issuer: env.JWT_ISSUER });
  if (decoded.purpose !== "oauth-register" || !decoded.email) {
    throw new Error("Invalid OAuth grant token");
  }
  return decoded;
};

export const generateRefreshToken = () => crypto.randomBytes(48).toString("hex");

/**
 * Persist a refresh-token session. The plaintext token is returned once to
 * the client; only its SHA-256 hash is stored.
 */
export const issueRefreshSession = async ({ userId, organizationId, userAgent = "", ip = "" }) => {
  const token = generateRefreshToken();
  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  );
  await RefreshSession.create({
    user_id: userId,
    organization_id: organizationId,
    token_hash: hashToken(token),
    user_agent: userAgent,
    ip,
    expires_at: expiresAt,
  });
  return { token, expiresAt };
};

export const revokeRefreshSession = async (token) => {
  const tokenHash = hashToken(token);
  await RefreshSession.updateOne(
    { token_hash: tokenHash, revoked_at: null },
    { $set: { revoked_at: new Date() } }
  );
  return true;
};

/** Log out from all devices for a user. */
export const revokeAllUserSessions = async (userId) => {
  await RefreshSession.updateMany(
    { user_id: userId, revoked_at: null },
    { $set: { revoked_at: new Date() } }
  );
  return true;
};

/**
 * Find a valid (non-revoked, non-expired) session for a refresh token.
 */
export const findValidSession = async (token) => {
  const tokenHash = hashToken(token);
  return RefreshSession.findOne({
    token_hash: tokenHash,
    revoked_at: null,
    expires_at: { $gt: new Date() },
  });
};

export default {
  signAccessToken,
  verifyAccessToken,
  signEmailVerifyToken,
  verifyEmailVerifyToken,
  signOAuthGrant,
  verifyOAuthGrant,
  issueRefreshSession,
  revokeRefreshSession,
  revokeAllUserSessions,
  findValidSession,
  hashToken,
};
