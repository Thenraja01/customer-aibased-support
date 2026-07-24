import admin from "firebase-admin";

let firebaseInitialized = false;

export const initFirebase = () => {
  if (firebaseInitialized) return;
  try {
    const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    if (serviceAccountJson) {
      const serviceAccount = JSON.parse(serviceAccountJson);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin Initialized successfully.");
    }
  } catch (err) {
    console.error("Failed to initialize Firebase Admin:", err.message);
  }
};

export const sendPushNotification = async (fcmToken, { title, body, data = {} }) => {
  if (!fcmToken) return;
  initFirebase();
  if (!firebaseInitialized) return;

  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
    });
  } catch (err) {
    console.error("Error sending FCM push notification:", err.message);
  }
};
