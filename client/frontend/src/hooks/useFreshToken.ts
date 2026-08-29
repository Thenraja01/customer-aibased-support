import { useSyncExternalStore } from "react";
import { AUTH_TOKEN_EVENT } from "@/api/axiosInstance";
import { getTokenFromStorage } from "@/utils/localStorage";

function subscribe(callback: () => void) {
  window.addEventListener(AUTH_TOKEN_EVENT, callback);
  return () => {
    window.removeEventListener(AUTH_TOKEN_EVENT, callback);
  };
}

function getSnapshot(): string | null {
  return getTokenFromStorage();
}

/**
 * Read the current access token straight from storage and automatically
 * re-render when the token is refreshed (or cleared) by the axios 401
 * interceptor. Use this instead of `useAuth().token` when the token is
 * sent with raw `fetch` calls that bypass axios.
 */
export function useFreshToken(): string | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}