import axios from "axios";
import {
  STORAGE_KEYS,
  safeGetItem,
  saveSession,
} from "@/utils/localStorage";

const AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
  timeout: 20000,
});

/**
 * Broadcast whenever the stored access token changes (refresh success or
 * logout). Consumers that read auth state outside axios (raw fetch / SSE)
 * can subscribe and re-read the fresh token from storage.
 */
export const AUTH_TOKEN_EVENT = "auth:token-refreshed";

const dispatchTokenEvent = () => {
  try {
    window.dispatchEvent(new Event(AUTH_TOKEN_EVENT));
  } catch {
    /* ignore */
  }
};

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

const flushQueue = (token: string | null) => {
  pendingQueue.forEach((cb) => cb(token));
  pendingQueue = [];
};

// Request interceptor — attach the current access token.
AxiosInstance.interceptors.request.use(
  (config) => {
    let token = safeGetItem<string>(STORAGE_KEYS.TOKEN);
    if (token) {
      if (typeof token === "string") {
        token = token.replace(/^["']|["']$/g, "").trim();
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantId = safeGetItem<string>(STORAGE_KEYS.ORG_ID);
    if (tenantId) {
      config.headers["x-tenant-id"] = tenantId;
    }
    const branchId = safeGetItem<string>(STORAGE_KEYS.BRANCH_ID);
    if (branchId) {
      config.headers["x-branch-id"] = branchId;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — transparently rotate the access token on 401.
AxiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry) {
      // Never attempt refresh on the refresh request itself.
      if (original.url?.includes("/auth/v1/refresh")) {
        flushAndRedirect();
        return Promise.reject(error);
      }

      const currentRefresh = safeGetItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
      if (!currentRefresh) {
        flushAndRedirect();
        return Promise.reject(error);
      }

      original._retry = true;

      if (isRefreshing) {
             return new Promise((resolve, reject) => {
          pendingQueue.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(AxiosInstance(original));
            } else {
              reject(error);
            }
          });
        });
      }

      isRefreshing = true;

      try {
        const res = await AxiosInstance.post("/auth/v1/refresh", {
          refreshToken: currentRefresh,
        });
        const accessToken = res.data?.accessToken || res.data?.token;
        const newRefreshToken = res.data?.refreshToken;

        if (!accessToken) throw new Error("No access token in refresh response");
       saveSession({
          token: accessToken,
          refreshToken: newRefreshToken || currentRefresh,
          user: res.data?.user || safeGetItem(STORAGE_KEYS.USER) || {},
        });
        dispatchTokenEvent();
        flushQueue(accessToken);

        original.headers.Authorization = `Bearer ${accessToken}`;
        return AxiosInstance(original);
      } catch (refreshError) {
        flushQueue(null);
        flushAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

let redirected = false;
function flushAndRedirect() {
  // Best-effort wipe of token keys; AuthContext.logout does the full cleanup.
  try {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } catch {
    /* ignore */
  }
  dispatchTokenEvent();
  if (redirected) return;
  redirected = true;
  const path = window.location.pathname;
  if (path !== "/login" && path !== "/register") {
    window.location.href = "/login";
  }
  setTimeout(() => {
    redirected = false;
  }, 1000);
}

export default AxiosInstance;
