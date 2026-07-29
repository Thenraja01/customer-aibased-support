import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser, logout as reduxLogout } from "@/store/slices";
import { AuthAPI } from "@/api/auth.api.js";
import { AdminAPI } from "@/api/admin.api.js";
import { UsersAPI } from "@/api/user.api.js";
import { requestForToken } from "@/config/firebase";
import { fetchTenantSettings, applyBrandColors } from "@/hooks/useTenant";
import { getSessionMeta, saveSession, clearSession, safeSetItem, safeGetItem, STORAGE_KEYS } from "@/utils/localStorage";

interface AuthContextType {
  user: any;
  token: string | null;
  orgSettings: any;
  setOrgSettings: (settings: any) => void;
  tenant: any;
  tenantLoading: boolean;
  loading: boolean;
  authError: string | null;
  login: (email: string, password: string, organizationId?: string) => Promise<boolean>;
  loginWithOrg: (email: string, password: string, organizationId: string) => Promise<boolean>;
  logout: () => void;
  setSession: (userData: any, authToken: string, refreshToken?: string) => boolean;
  isAuthenticated: boolean;
  /** Check if the current user has a permission (or wildcard). */
  can: (permission: string) => boolean;
  /** Check if the current user has ANY of the given permissions. */
  canAny: (permissions: string[]) => boolean;
  /** Check if the current user has ALL of the given permissions. */
  canAll: (permissions: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUser(user: any) {
  if (!user) return null;
  const normalized = { ...user, _id: user._id || user.id };
  if (typeof normalized.role_id === "object" && normalized.role_id?.role_name) {
    normalized.role_id = {
      ...normalized.role_id,
      role_name: normalized.role_id.role_name.toLowerCase().replace(/\s+/g, "_"),
    };
  }
  return normalized;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const isMountedRef = useRef(true);
  const isCreatingRef = useRef(false);

  // Initialize from localStorage instead of state
  const sessionMeta = getSessionMeta();
  const [token, setToken] = useState<string | null>(sessionMeta.token || null);
  const [user, setUser] = useState<any>(sessionMeta.user || null);
  const isAuthenticated = !!token && !!user;

  // Permission helpers
  const can = useCallback((permission: string): boolean => {
    if (!user) return false;
    const perms = user.permissions || [];
    return perms.includes("*") || perms.includes(permission);
  }, [user]);

  const canAny = useCallback((permissions: string[]): boolean => {
    return permissions.some(can);
  }, [can]);

  const canAll = useCallback((permissions: string[]): boolean => {
    return permissions.every(can);
  }, [can]);

  const [orgSettings, setOrgSettings] = useState<any>(sessionMeta.orgSettings);
  const [tenant, setTenant] = useState<any>(null);
  const [tenantLoading, setTenantLoading] = useState(false); // Set to false since we're reading from localStorage
  const [loading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let isSubscribed = true;
    const sessionMeta = getSessionMeta();
    const orgId = sessionMeta.orgId;

    if (orgId) {
      AdminAPI.getOrgSettings()
        .then((res) => {
          if (!isSubscribed) return;
          if (res?.data?.success) {
            const settings = res.data.data;
            setOrgSettings(settings);
            saveSession({
              token: sessionMeta.token || "",
              refreshToken: localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) || "",
              user: sessionMeta.user,
              orgSettings: settings,
            });
          }
        })
        .catch((error) => {
          if (isSubscribed) {
            console.error("Failed to load org settings:", error);
          }
        });
    }

    requestForToken()
      .then((fcmToken) => {
        if (!isSubscribed) return;
        if (fcmToken && sessionMeta.userId) {
          UsersAPI.updateProfile({ fcm_token: fcmToken }).catch((error) => {
            console.error("Failed to update FCM token:", error);
          });
        }
      })
      .catch((error) => {
        console.error("Failed to request FCM token:", error);
      });

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (orgSettings?.brand_colors) {
      applyBrandColors(orgSettings.brand_colors);
    }
  }, [orgSettings]);

  useEffect(() => {
    if (isAuthenticated && user) {
      dispatch(setReduxUser(user));
    }
  }, [isAuthenticated, user, dispatch]);

  useEffect(() => {
    if (!isAuthenticated) {
      setTenantLoading(false);
      return;
    }

    let isSubscribed = true;
    const sessionMeta = getSessionMeta();
    const orgId = sessionMeta.orgId;

    if (orgId) {
      fetchTenantSettings(orgId)
        .then((tenantData) => {
          if (!isSubscribed) return;
          setTenant(tenantData);
          setTenantLoading(false);
        })
        .catch((error) => {
          if (isSubscribed) {
            console.error("Failed to load tenant settings:", error);
            setTenantLoading(false);
          }
        });
    } else {
      setTenantLoading(false);
    }

    return () => {
      isSubscribed = false;
    };
  }, [isAuthenticated]);

  const login = useCallback(async (email: string, password: string, organizationId?: string) => {
    setAuthError(null);

    if (!email || !password) {
      setAuthError("Email and password are required");
      return false;
    }

    if (isCreatingRef.current) return false;
    isCreatingRef.current = true;

    try {
      const payload: any = { email, password };
      if (organizationId) payload.organization_id = organizationId;

      const res = await AuthAPI.login(payload);

      if (!res?.data?.success) {
        setAuthError(res?.data?.message || "Login failed");
        return false;
      }

      const normalized = normalizeUser(res.data.data);
      if (!normalized) {
        setAuthError("Invalid user data received");
        return false;
      }

      const tokenStr = res.data.token || res.data.accessToken;
      const refreshTokenStr = res.data.refreshToken || "";
      const storageOk = safeSetItem(STORAGE_KEYS.TOKEN, tokenStr)
        && safeSetItem(STORAGE_KEYS.REFRESH_TOKEN, refreshTokenStr)
        && safeSetItem(STORAGE_KEYS.USER, normalized);

      if (!storageOk) {
        setAuthError("Failed to save session data");
        return false;
      }

      if (organizationId) {
        safeSetItem(STORAGE_KEYS.SELECTED_TENANT, organizationId);
      }

      if (!isMountedRef.current) return false;

      setToken(tokenStr);
      setUser(normalized);
      dispatch(setReduxUser(normalized));

      const orgId = typeof normalized.organization_id === "object"
        ? normalized.organization_id?._id
        : normalized.organization_id;

      if (orgId) {
        try {
          const settingsRes = await AdminAPI.getOrgSettings();
          if (settingsRes?.data?.success && isMountedRef.current) {
            const settings = settingsRes.data.data;
            setOrgSettings(settings);
            setTenant(settings);
            safeSetItem(STORAGE_KEYS.ORG_SETTINGS, settings);
          }
        } catch (settingsError) {
          console.error("Failed to load org settings after login:", settingsError);
        }
      }

      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      const message = error?.response?.data?.message || error?.message || "Login failed";
      setAuthError(message);
      return false;
    } finally {
      isCreatingRef.current = false;
    }
  }, [dispatch]);

  const loginWithOrg = useCallback(async (email: string, password: string, organizationId: string) => {
    if (!organizationId) {
      setAuthError("Organization ID is required");
      return false;
    }
    return login(email, password, organizationId);
  }, [login]);

  const logout = useCallback(() => {
    const refreshToken = safeGetItem<string>(STORAGE_KEYS.REFRESH_TOKEN);
    if (refreshToken) {
      AuthAPI.logout(refreshToken).catch((error) => {
        console.error("Failed to revoke session server-side:", error);
      });
    }
    clearSession();
    setToken(null);
    setUser(null);
    setOrgSettings(null);
    setTenant(null);
    setAuthError(null);
    dispatch(reduxLogout());
  }, [dispatch]);

  const setSession = useCallback((userData: any, authToken: string, refreshToken?: string): boolean => {
    const normalized = normalizeUser(userData);
    if (!normalized) {
      setAuthError("Invalid user data");
      return false;
    }

    const storageOk = safeSetItem(STORAGE_KEYS.TOKEN, authToken)
      && safeSetItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken || "")
      && safeSetItem(STORAGE_KEYS.USER, normalized);

    if (!storageOk) {
      setAuthError("Failed to save session data");
      return false;
    }

    setToken(authToken);
    setUser(normalized);
    dispatch(setReduxUser(normalized));

    const orgId = typeof normalized.organization_id === "object"
      ? normalized.organization_id?._id
      : normalized.organization_id;

    if (orgId) {
      safeSetItem(STORAGE_KEYS.SELECTED_TENANT, orgId);
    }

    return true;
  }, [dispatch]);

  const value = {
    user,
    token,
    orgSettings,
    setOrgSettings,
    tenant,
    tenantLoading,
    loading,
    authError,
    login,
    loginWithOrg,
    logout,
    setSession,
    isAuthenticated,
    can,
    canAny,
    canAll,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be inside AuthProvider");
  return ctx;
};
