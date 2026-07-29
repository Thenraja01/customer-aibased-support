import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import env from "../../config/env.js";

/**
 * Google OAuth 2.0 with PKCE (authorization code flow).
 * The SPA generates the verifier/challenge; the server only exchanges the
 * code and verifies the returned ID token server-side.
 */

export const generatePkcePair = () => {
  const verifier = crypto.randomBytes(32).toString("base64url");
  const challenge = crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64url");
  return { verifier, challenge };
};

export const getAuthUrl = ({ state, codeChallenge, redirectUri }) => {
  const client = new OAuth2Client(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri || env.GOOGLE_CALLBACK_URL);
  return client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
};

/**
 * Exchange the authorization code and verify the ID token server-side.
 * Returns a normalized identity — nothing more. OAuth never grants org/roles.
 */
export const verifyAuthorizationCode = async ({ code, codeVerifier, code_verifier, redirectUri, redirect_uri }) => {
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    throw new Error("Google OAuth is not configured");
  }

  const targetRedirectUri = redirectUri || redirect_uri || env.GOOGLE_CALLBACK_URL;
  const targetCodeVerifier = codeVerifier || code_verifier;

  const client = new OAuth2Client(
    env.GOOGLE_CLIENT_ID,
    env.GOOGLE_CLIENT_SECRET,
    targetRedirectUri
  );

  const { tokens } = await client.getToken({
    code,
    codeVerifier: targetCodeVerifier,
    code_verifier: targetCodeVerifier,
    redirectUri: targetRedirectUri,
    redirect_uri: targetRedirectUri,
  });

  const ticket = await client.verifyIdToken({
    idToken: tokens.id_token,
    audience: env.GOOGLE_CLIENT_ID,
  });

  const payload = ticket.getPayload();
  if (!payload || !payload.sub || !payload.email) {
    throw new Error("Invalid Google identity");
  }

  return {
    provider: "google",
    providerId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    emailVerified: Boolean(payload.email_verified),
    name: payload.name || payload.email,
    picture: payload.picture || null,
  };
};

export default {
  generatePkcePair,
  getAuthUrl,
  verifyAuthorizationCode,
};
