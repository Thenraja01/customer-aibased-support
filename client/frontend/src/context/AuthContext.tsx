import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser, logout as reduxLogout } from "@/store/slices";
import { AuthAPI } from "@/api/auth.api.js";
import { tokenManager } from "@/utils/tokenManager";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const [user, setUser] = useState<any>(() => {
    const data = localStorage.getItem("user");
    return data ? JSON.parse(data) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user));
    }
    setLoading(false);
  }, [dispatch, user]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await AuthAPI.login({ email, password });
      const payload = res.data ?? {};
      const token = payload.access_token || payload.token || payload.data?.access_token || payload.data?.token;
      const userData = payload.data ?? payload.user ?? payload.data?.user ?? null;
      const uiConfig = payload.ui_config ?? payload.data?.ui_config ?? null;

      if (!token || !userData) return false;

      localStorage.setItem("token", token);
      tokenManager.setAccessToken(token);
      localStorage.setItem("user", JSON.stringify(userData));
      if (uiConfig) {
        localStorage.setItem("ui_config", JSON.stringify(uiConfig));
      }

      setUser(userData);
      dispatch(setReduxUser(userData));

      return true;
    } catch {
      return false;
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("ui_config");
    tokenManager.clearTokens();
    setUser(null);
    dispatch(reduxLogout());
  }, [dispatch]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuthContext = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuthContext must be inside AuthProvider");
  return ctx;
};
