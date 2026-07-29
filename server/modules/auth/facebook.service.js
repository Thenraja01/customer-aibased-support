import crypto from "crypto";
import env from "../../config/env.js";

/**
 * Facebook OAuth (login). The SPA redirects to Facebook, then sends the
 * resulting `code` here. The server exchanges it for a user access token,
 * validates it against the app with an appsecret proof, then fetches the
 * profile. Token validation always happens server-side.
 */

export const generateState = () =>
  crypto.randomBytes(24).toString("hex");

export const getAuthUrl = ({ state, redirectUri }) => {
  const params = new URLSearchParams({
    client_id: env.FACEBOOK_CLIENT_ID,
    redirect_uri: redirectUri || env.FACEBOOK_CALLBACK_URL,
    state,
    response_type: "code",
    scope: "email,public_profile",
  });
  return `https://www.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/dialog/oauth?${params.toString()}`;
};

export const getAppAccessToken = async () => {
  const url = `https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/oauth/access_token?client_id=${env.FACEBOOK_CLIENT_ID}&client_secret=${env.FACEBOOK_CLIENT_SECRET}&grant_type=client_credentials`;
  const res = await fetch(url);
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    throw new Error("Facebook app access token could not be obtained");
  }
  return data.access_token;
};

/**
 * Exchange code → user token → verify → profile.
 * Returns a normalized identity only.
 */
export const verifyAuthorizationCode = async ({ code, redirectUri, redirect_uri }) => {
  if (!env.FACEBOOK_CLIENT_ID || !env.FACEBOOK_CLIENT_SECRET) {
    throw new Error("Facebook OAuth is not configured");
  }

  const redirect = redirectUri || redirect_uri;

  const tokenUrl =
    `https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/oauth/access_token?` +
    new URLSearchParams({
      client_id: env.FACEBOOK_CLIENT_ID,
      client_secret: env.FACEBOOK_CLIENT_SECRET,
      redirect_uri: redirect || env.FACEBOOK_CALLBACK_URL,
      code,
    }).toString();

  const tokenRes = await fetch(tokenUrl);
  const tokenData = await tokenRes.json();
  if (!tokenRes.ok || !tokenData.access_token) {
    throw new Error("Invalid Facebook authorization code");
  }
  const userAccessToken = tokenData.access_token;

  // Verify the token belongs to our app.
  const appAccessToken = await getAppAccessToken();
  const proof = crypto
    .createHmac("sha256", env.FACEBOOK_CLIENT_SECRET)
    .update(userAccessToken)
    .digest("hex");

  const debugUrl =
    `https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/debug_token?` +
    new URLSearchParams({
      input_token: userAccessToken,
      access_token: `${env.FACEBOOK_CLIENT_ID}|${env.FACEBOOK_CLIENT_SECRET}`,
      appsecret_proof: proof,
    }).toString();

  const debugRes = await fetch(debugUrl);
  const debugData = await debugRes.json();
  const info = debugData?.data;
  if (!info?.is_valid || info.app_id !== env.FACEBOOK_CLIENT_ID) {
    throw new Error("Invalid Facebook token");
  }

  // Fetch profile.
  const meUrl =
    `https://graph.facebook.com/${env.FACEBOOK_GRAPH_VERSION}/me?` +
    new URLSearchParams({
      fields: "id,name,email,picture.type(large)",
      access_token: userAccessToken,
      appsecret_proof: proof,
    }).toString();

  const meRes = await fetch(meUrl);
  const me = await meRes.json();
  if (!meRes.ok || !me.id) {
    throw new Error("Could not fetch Facebook profile");
  }
  if (!me.email) {
    throw new Error("Facebook account has no verified email. Please log in with your email and password instead.");
  }

  return {
    provider: "facebook",
    providerId: me.id,
    email: me.email.toLowerCase().trim(),
    emailVerified: true,
    name: me.name || me.email,
    picture: me.picture?.data?.url || null,
  };
};

export default {
  generateState,
  getAuthUrl,
  verifyAuthorizationCode,
};
