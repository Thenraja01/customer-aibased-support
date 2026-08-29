import admin, { cert } from "firebase-admin";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

let firebaseInitialized = false;

export const initFirebase = () => {
  if (firebaseInitialized) return;
  try {
    let serviceAccount;

    const envJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (envJson) {
      serviceAccount = JSON.parse(envJson);
    }

    // Fallback: try loading from device-management.json
    if (!serviceAccount) {
      const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
        resolve(__dirname, "device-management.json");
      if (existsSync(filePath)) {
        const raw = readFileSync(filePath, "utf-8");
        serviceAccount = JSON.parse(raw);
      }
    }

    if (!serviceAccount) {
      console.warn(
        "[Firebase] No service account found — push notifications disabled. " +
        "Set FIREBASE_SERVICE_ACCOUNT env var or ensure device-management.json exists."
      );
      return;
    }

    admin.initializeApp({
      credential: cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log("[Firebase] Admin SDK initialized successfully.");
  } catch (err) {
    console.error("[Firebase] Failed to initialize Admin SDK:", err.message);
  }
};

const buildMessage = (token, { title, body, data = {} }) => ({
  token,
  notification: { title, body },
  data: Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, String(v)])
  ),
  android: { priority: "high" },
  apns: { headers: { "apns-priority": "10" } },
  webpush: { headers: { Urgency: "high" } },
});
export const sendPushNotification = async (fcmToken, { title, body, data = {} }) => {
  if (!fcmToken) return;
  if (!firebaseInitialized) {
    console.warn("[Firebase] SDK not initialized — skipping push notification.");
    return;
  }

  const message = buildMessage(fcmToken, { title, body, data });

  try {
    const messageId = await admin.messaging().send(message);
    console.log("[Firebase] Push notification sent:", messageId);
    return messageId;
  } catch (err) {
    if (err.code === "messaging/registration-token-not-registered") {
      // Lazily import User to avoid circular-dependency issues at module load time
      try {
        const { default: User } = await import("../modules/user/user.schema.js");
        await User.updateOne(
          { fcm_token: fcmToken },
          { $unset: { fcm_token: "" } }
        );
        console.warn("[Firebase] Stale FCM token removed:", fcmToken);
      } catch (cleanupErr) {
        console.error("[Firebase] Failed to remove stale token:", cleanupErr.message);
      }
    } else {
      console.error("[Firebase] Error sending push notification:", err.message);
    }
    throw err;
  }
};

export const sendMulticastNotification = async (tokens, { title, body, data = {} }) => {
  if (!tokens || tokens.length === 0) return;
  if (!firebaseInitialized) {
    console.warn("[Firebase] SDK not initialized — skipping multicast notification.");
    return;
  }

  const message = {
    tokens,
    notification: { title, body },
    data: Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, String(v)])
    ),
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } },
    webpush: { headers: { Urgency: "high" } },
  };

  try {
    const response = await admin.messaging().sendEachForMulticast(message);
    console.log(
      `[Firebase] Multicast sent: ${response.successCount} success, ${response.failureCount} failure`
    );

    // Clean up stale tokens from failed sends
    const staleTokens = [];
    response.responses.forEach((resp, idx) => {
      if (
        !resp.success &&
        resp.error?.code === "messaging/registration-token-not-registered"
      ) {
        staleTokens.push(tokens[idx]);
      }
    });

    if (staleTokens.length > 0) {
      try {
        const { default: User } = await import("../modules/user/user.schema.js");
        await User.updateMany(
          { fcm_token: { $in: staleTokens } },
          { $unset: { fcm_token: "" } }
        );
        console.warn(`[Firebase] Removed ${staleTokens.length} stale FCM token(s).`);
      } catch (cleanupErr) {
        console.error("[Firebase] Failed to remove stale tokens:", cleanupErr.message);
      }
    }

    return response;
  } catch (err) {
    console.error("[Firebase] Error sending multicast notification:", err.message);
    throw err;
  }
};

export default admin;
