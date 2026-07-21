import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { useDispatch } from "react-redux";
import { setUser as setReduxUser, logout as reduxLogout } from "@/store/slices";
import { AuthAPI } from "@/api/auth.api.js";

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function normalizeUser(user: any) {
  if (!user) return null;
  return { ...user, _id: user._id || user.id };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const dispatch = useDispatch();
  const [user, setUser] = useState<any>(() => {
    const data = localStorage.getItem("user");
    return data ? normalizeUser(JSON.parse(data)) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      dispatch(setReduxUser(user));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await AuthAPI.login({ email, password });
      if (!res.data.success) return false;

      const normalized = normalizeUser(res.data.data);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(normalized));

      setUser(normalized);
      dispatch(setReduxUser(normalized));

      return true;
    } catch {
      return false;
    }
  }, [dispatch]);

  const logout = useCallback(() => {
    localStorage.clear();
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
