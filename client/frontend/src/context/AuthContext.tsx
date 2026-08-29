import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AuthAPI } from "@/api/auth.api.js";
import { AdminAPI } from "@/api";
import { UsersAPI } from "@/api/user.api.js";
import { requestForToken } from "@/config/firebase";
import { AUTH_TOKEN_EVENT } from "@/api/axiosInstance";
import { fetchTenantSettings, applyBrandColors } from "@/hooks/useTenant";
import {
  safeGetItem,
  safeSetItem,
  saveSession,
  clearSession,
  getUserFromStorage,
  getTokenFromStorage,
  sanitizeOrgSettingsForStorage,
} from "@/utils/localStorage";

interface AuthContextType {
  user: any;
  token: string | null;
  refreshToken: string | null;
  orgSettings: any;
  setOrgSettings: (settings: any) => void;
  tenant: any;
  tenantLoading: boolean;
  loading: boolean;
  isAuthenticated: boolean;
  authError: string | null;
  login: (email: string, password: string, organizationId?: string) => Promise<boolean>;
  loginWithOrg: (email: string, password: string, organizationId: string) => Promise<boolean>;
  setSession: (data: any) => boolean;
  updateUser: (data: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * Normalize the backend user into a stable shape the UI can rely on:
 *   - `roles[]` — role names (e.g. ["Admin"])
 *   - `roleName` — primary role name (roles[0])
 *   - `role_id` — legacy single-role field, kept for backward compatibility
 */
function normalizeUser(user: any) {
  if (!user) return null;
  const roles = Array.isArray(user.roles)
    ? user.roles.map((r: any) =>
        typeof r === "string" ? r : r?.role_name || r?.name || ""
      ).filter(Boolean)
    : [];
  const primaryRole = roles[0] || null;

  const normalized: any = {
    ...user,
    _id: user._id || user.id || user.userId,
    userId: user.userId || user._id || user.id,
    roles,
    roleName: user.roleName || primaryRole || null,
  };

  if (primaryRole) {
    normalized.role_id = normalized.role_id || {
      _id: user.roleIds?.[0] || null,
      role_name: primaryRole.toLowerCase().replace(/\s+/g, "_"),
    };
  }

  return normalized;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const isMountedRef = useRef(true);
  const isCreatingRef = useRef(false);

  const [user, setUser] = useState<any>(() => normalizeUser(getUserFromStorage()));
  const [orgSettings, setOrgSettings] = useState<any>(() => safeGetItem("auth_org_settings"));
  const [token, setToken] = useState<string | null>(() => safeGetItem("auth_token"));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => safeGetItem("auth_refresh_token"));
  const [tenant, setTenant] = useState<any>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Keep React auth state in sync when the axios interceptor silently rotates
  // the access token (or a failed refresh clears the session).
  useEffect(() => {
    const handleTokenEvent = () => {
      const freshToken = getTokenFromStorage();
      setToken(freshToken);
      if (freshToken) {
        const storedUser = getUserFromStorage();
        if (storedUser) {
          setUser((prev: any) => normalizeUser(storedUser) || prev);
        }
      } else {
        setUser(null);
        setRefreshToken(null);
      }
    };
    window.addEventListener(AUTH_TOKEN_EVENT, handleTokenEvent);
    return () => {
      window.removeEventListener(AUTH_TOKEN_EVENT, handleTokenEvent);
    };
  }, []);

  useEffect(() => {
    if (!user?._id) return;

    let isSubscribed = true;
    const orgId = typeof user.organization_id === "object"
      ? user.organization_id?._id
      : user.organization_id;

    if (orgId) {
      AdminAPI.getOrgSettings()
        .then((res) => {
          if (!isSubscribed) return;
          if (res?.data?.success) {
            const settings = res.data.data;
            setOrgSettings(settings);
            safeSetItem("auth_org_settings", sanitizeOrgSettingsForStorage(settings));
            if (settings?.brand_colors) {
              applyBrandColors(settings.brand_colors);
            }
          }
        })
        .catch((error) => {
          if (isSubscribed) {
            if (import.meta.env.DEV) console.warn("Org settings unavailable:", error?.response?.status || error?.message);
          }
        });
    }

    requestForToken()
      .then((token) => {
        if (!isSubscribed) return;
        if (token && user?._id) {
          UsersAPI.updateProfile({ fcm_token: token }).catch((error) => {
            if (import.meta.env.DEV) console.warn("Failed to update FCM token:", error?.message);
          });
        }
      })
      .catch((error) => {
        if (import.meta.env.DEV) console.warn("Failed to request FCM token:", error?.message);
      });

    return () => {
      isSubscribed = false;
    };
  }, [user?._id]);

  useEffect(() => {
    if (orgSettings?.brand_colors) {
      applyBrandColors(orgSettings.brand_colors);
    }
  }, [orgSettings]);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user && orgSettings) {
      setTenantLoading(false);
      return;
    }

    let isSubscribed = true;

    const loadTenant = async () => {
      try {
        const data = await fetchTenantSettings();
        if (!isSubscribed) return;
        if (data) {
          setTenant(data);
          if (!orgSettings) {
            setOrgSettings(data);
          }
        }
        setTenantLoading(false);
      } catch (error) {
        if (!isSubscribed) return;
        console.error("Failed to load tenant settings:", error);
        setTenantLoading(false);
      }
    };

    loadTenant();

    return () => {
      isSubscribed = false;
    };
  }, []);

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

      const normalized = normalizeUser(res.data.data || res.data.user);
      if (!normalized) {
        setAuthError("Invalid user data received");
        return false;
      }

      const tokenStr = res.data.accessToken || res.data.token;
      const refreshStr = res.data.refreshToken || "";
      const storageOk = saveSession({
        token: tokenStr,
        refreshToken: refreshStr,
        user: normalized,
      });

      if (!storageOk) {
        setAuthError("Failed to save session data");
        return false;
      }

      if (!isMountedRef.current) return false;

      setToken(tokenStr);
      setRefreshToken(refreshStr);
      setUser(normalized);

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
            safeSetItem("auth_org_settings", sanitizeOrgSettingsForStorage(settings));
          }
        } catch (settingsError: any) {
          if (import.meta.env.DEV) console.warn("Org settings unavailable after login:", settingsError?.response?.status || settingsError?.message);
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
  }, []);

  const loginWithOrg = useCallback(async (email: string, password: string, organizationId: string) => {
    if (!organizationId) {
      setAuthError("Organization ID is required");
      return false;
    }
    return login(email, password, organizationId);
  }, [login]);

  /**
   * Persist a session returned by an OAuth callback (or any flow that
   * already produced tokens + a user object). Returns false on failure.
   */
  const setSession = useCallback((data: any): boolean => {
    const tokenStr = data?.accessToken || data?.token;
    if (!tokenStr) {
      setAuthError("No access token in session data");
      return false;
    }

    const normalized = normalizeUser(data.user || data.data);
    if (!normalized) {
      setAuthError("Invalid user data in session");
      return false;
    }

    const refreshStr = data.refreshToken || "";
    const storageOk = saveSession({
      token: tokenStr,
      refreshToken: refreshStr,
      user: normalized,
      orgSettings: data.orgSettings,
    });

    if (!storageOk) {
      setAuthError("Failed to save session data");
      return false;
    }

    setToken(tokenStr);
    setRefreshToken(refreshStr);
    setUser(normalized);

    const orgId = typeof normalized.organization_id === "object"
      ? normalized.organization_id?._id
      : normalized.organization_id;

    if (orgId) {
      AdminAPI.getOrgSettings()
        .then((res) => {
          if (res?.data?.success) {
            const settings = res.data.data;
            setOrgSettings(settings);
            setTenant(settings);
            safeSetItem("auth_org_settings", sanitizeOrgSettingsForStorage(settings));
          }
        })
        .catch(() => {});
    }

    return true;
  }, []);

  const logout = useCallback(() => {
    try {
      const rt = refreshToken;
      clearSession();

      if (rt) {
        AuthAPI.logout({ refreshToken: rt }).catch(() => {
          /* best-effort server-side session revocation */
        });
      }
    } catch (error) {
      console.error("Failed to clear localStorage during logout:", error);
    }

    try {
      queryClient.clear();
    } catch {
      /* ignore if queryClient not active */
    }

    setToken(null);
    setRefreshToken(null);
    setUser(null);
    setOrgSettings(null);
    setTenant(null);
    setAuthError(null);
  }, [refreshToken, queryClient]);



  const updateUser = useCallback((updatedUserData: any) => {
    setUser((prev: any) => {
      const merged = normalizeUser({ ...prev, ...updatedUserData });
      const stored = getUserFromStorage();
      safeSetItem("auth_user", { ...stored, ...merged });
      return merged;
    });
  }, []);

  // Synchronize latest user profile (profileImage, names, settings) from backend
  useEffect(() => {
    if (!token) return;
    let isSubscribed = true;
    UsersAPI.getProfile()
      .then((res) => {
        if (!isSubscribed) return;
        if (res?.data?.success && res.data.data) {
          const freshUser = res.data.data;
          setUser((prev: any) => {
            const merged = normalizeUser({ ...prev, ...freshUser });
            const stored = getUserFromStorage();
            safeSetItem("auth_user", { ...stored, ...merged });
            return merged;
          });
        }
      })
      .catch(() => {});
    return () => {
      isSubscribed = false;
    };
  }, [token]);

  const value = {
    user,
    token,
    refreshToken,
    orgSettings,
    setOrgSettings,
    tenant,
    tenantLoading,
    loading,
    isAuthenticated: !!user && !!token,
    authError,
    login,
    loginWithOrg,
    setSession,
    updateUser,
    logout,
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
