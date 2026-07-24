import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser, logout as reduxLogout } from "@/store/slices";
import { AuthAPI } from "@/api/auth.api.js";
import { AdminAPI } from "@/api/admin.api.js";
import { UsersAPI } from "@/api/user.api.js";
import { requestForToken, onMessageListener } from "@/config/firebase";
import { fetchTenantSettings, applyBrandColors } from "@/hooks/useTenant";

interface AuthContextType {
  user: any;
  orgSettings: any;
  setOrgSettings: (settings: any) => void;
  tenant: any;
  tenantLoading: boolean;
  loading: boolean;
  login: (email: string, password: string, organizationId?: string) => Promise<boolean>;
  loginWithOrg: (email: string, password: string, organizationId: string) => Promise<boolean>;
  logout: () => void;
  can: (...permissions: string[]) => boolean;
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
  const [user, setUser] = useState<any>(() => {
    const data = localStorage.getItem("user");
    return data ? normalizeUser(JSON.parse(data)) : null;
  });
  const [orgSettings, setOrgSettings] = useState<any>(() => {
    const data = localStorage.getItem("orgSettings");
    return data ? JSON.parse(data) : null;
  });
  const [tenant, setTenant] = useState<any>(null);
  const [tenantLoading, setTenantLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const orgId = typeof user.organization_id === "object" ? user.organization_id?._id : user.organization_id;
      if (orgId) {
        AdminAPI.getOrgSettings().then((res) => {
          if (res.data.success) {
            setOrgSettings(res.data.data);
            localStorage.setItem("orgSettings", JSON.stringify(res.data.data));
          }
        }).catch(() => {});
      }

      requestForToken().then((token) => {
        if (token) {
          UsersAPI.updateProfile({ fcm_token: token }).catch(() => {});
        }
      });

      onMessageListener().then((payload: any) => {
        if (payload?.notification) {
          console.log("Foreground push notification received:", payload);
        }
      }).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (orgSettings?.brand_colors) {
      applyBrandColors(orgSettings.brand_colors);
    }
  }, [orgSettings]);

  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user || !orgSettings) {
      fetchTenantSettings().then((data) => {
        if (data) {
          setTenant(data);
          if (!orgSettings) {
            setOrgSettings(data);
          }
          applyBrandColors(data.brand_colors);
        }
        setTenantLoading(false);
      });
    } else {
      setTenantLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string, organizationId?: string) => {
    try {
      const payload: any = { email, password };
      if (organizationId) payload.organization_id = organizationId;
      const res = await AuthAPI.login(payload);
      if (!res.data.success) return false;

      const normalized = normalizeUser(res.data.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(normalized));
      if (organizationId) {
        localStorage.setItem("selectedTenantId", organizationId);
      }

      setUser(normalized);
      dispatch(setReduxUser(normalized));

      const orgId = typeof normalized.organization_id === "object" ? normalized.organization_id?._id : normalized.organization_id;
      if (orgId) {
        AdminAPI.getOrgSettings().then((r) => {
          if (r.data.success) {
            setOrgSettings(r.data.data);
            setTenant(r.data.data);
            localStorage.setItem("orgSettings", JSON.stringify(r.data.data));
          }
        }).catch(() => {});
      }

      return true;
    } catch {
      return false;
    }
  }, [dispatch]);

  const loginWithOrg = useCallback(async (email: string, password: string, organizationId: string) => {
    return login(email, password, organizationId);
  }, [login]);

  const logout = useCallback(() => {
    localStorage.clear();
    setUser(null);
    setOrgSettings(null);
    setTenant(null);
    dispatch(reduxLogout());
  }, [dispatch]);

  const can = useCallback((...permissions: string[]): boolean => {
    if (!user) return false;
    const roleName = typeof user.role_id === "object" ? user.role_id?.role_name : user.role_id;
    if (roleName === "super_admin") return true;
    const userPerms = user.role_id?.permissions || user.permissions || [];
    return permissions.length === 0 || permissions.some((p) => userPerms.includes(p));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, orgSettings, setOrgSettings, tenant, tenantLoading, loading, login, loginWithOrg, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be inside AuthProvider");
  return ctx;
};
