import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "",
};

let app: any = null;
let messaging: any = null;

try {
  if (firebaseConfig.apiKey && firebaseConfig.appId) {
    app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  }
} catch (err) {
  console.error("Firebase frontend init error:", err);
}

export { messaging };

const supportsPush = () =>
  typeof window !== "undefined" &&
  "Notification" in window &&
  "serviceWorker" in navigator &&
  Notification.permission !== "denied";

export const requestForToken = async (): Promise<string | null> => {
  try {
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!messaging || !supportsPush() || !vapidKey) return null;
    const currentToken = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY || "",
      serviceWorkerRegistration: await navigator.serviceWorker
        .getRegistration()
        .catch(() => undefined),
    });
    if (currentToken) {
      return currentToken;
    }
    return null;
  } catch (err: any) {
    // Push registration is optional for app functionality; a missing/invalid
    // VAPID key or unavailable push service must not spam errors.
    if (err?.name === "AbortError" || err?.code === "messaging/token-unsubscribe-failed") {
      console.warn("Firebase push token registration unavailable:", err?.message);
    } else {
      console.error("An error occurred while retrieving token.", err);
    }
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    if (!messaging) return;
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });

export const onForegroundMessage = (callback: (payload: any) => void) => {
  if (!messaging) return () => {};
  const unsubscribe = onMessage(messaging, (payload) => {
    callback(payload);
  });
  return unsubscribe;
};
