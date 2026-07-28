import admin from "firebase-admin";

let firebaseInitialized = false;

/**
 * Initialize Firebase Admin SDK.
 * Call this ONCE at server startup (from server.js).
 * Subsequent calls are no-ops due to the guard flag.
 */
export const initFirebase = () => {
  if (firebaseInitialized) return;
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (!serviceAccountJson) {
      console.warn(
        "[Firebase] FIREBASE_SERVICE_ACCOUNT env var not set — push notifications disabled."
      );
      return;
    }
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    firebaseInitialized = true;
    console.log("[Firebase] Admin SDK initialized successfully.");
  } catch (err) {
    console.error("[Firebase] Failed to initialize Admin SDK:", err.message);
  }
};

/**
 * Build the recommended FCM message payload.
 * Converts all custom data values to strings (FCM requirement).
 * Sets high-priority headers for Android, APNS, and Web Push.
 *
 * @param {string} token - Single device FCM registration token
 * @param {string} title - Notification title
 * @param {string} body  - Notification body
 * @param {Object} data  - Optional custom key/value data (values coerced to string)
 * @returns {Object} FCM message object
 */
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

/**
 * Send a push notification to a single device.
 * Automatically clears the stale token from the User document if FCM
 * reports it as no longer registered.
 *
 * @param {string} fcmToken - Target device FCM token
 * @param {{ title: string, body: string, data?: Object }} payload
 */
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

/**
 * Send a push notification to multiple devices (multicast).
 * Uses sendEachForMulticast which is the FCM HTTP v1 recommended approach
 * for targeting multiple tokens in a single call.
 *
 * @param {string[]} tokens - Array of FCM registration tokens
 * @param {{ title: string, body: string, data?: Object }} payload
 */
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
