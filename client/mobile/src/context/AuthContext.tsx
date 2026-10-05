import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { apiClient } from "../api/client";

export interface User {
  _id: string;
  name: string;
  email: string;
  role?: string;
  role_id?: any;
  organization_id?: {
    _id: string;
    name: string;
  } | string;
  branch_id?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, organization_id?: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session from SecureStore on app launch
  const restoreSession = useCallback(async () => {
    try {
      const storedToken = await SecureStore.getItemAsync("auth_token");
      const storedUser = await SecureStore.getItemAsync("auth_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.warn("Failed to restore session", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  const login = async (email: string, password: string, organization_id?: string) => {
    try {
      const response = await apiClient.post("/auth/v1/login", {
        email: email.trim(),
        password,
        ...(organization_id ? { organization_id } : {}),
      });

      const { success, token: receivedToken, data, user: responseUser } = response.data;

      if (success && receivedToken) {
        const loggedInUser = data || responseUser;
        setToken(receivedToken);
        setUser(loggedInUser);

        await SecureStore.setItemAsync("auth_token", receivedToken);
        await SecureStore.setItemAsync("auth_user", JSON.stringify(loggedInUser));

        return { success: true };
      }

      return {
        success: false,
        message: response.data.message || "Invalid credentials",
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || "Failed to sign in. Please try again.";
      return { success: false, message: msg };
    }
  };

  const register = async (data: any) => {
    try {
      const response = await apiClient.post("/auth/v1/register", data);
      const { success, token: receivedToken, data: registeredUser } = response.data;

      if (success && receivedToken) {
        setToken(receivedToken);
        setUser(registeredUser);

        await SecureStore.setItemAsync("auth_token", receivedToken);
        await SecureStore.setItemAsync("auth_user", JSON.stringify(registeredUser));

        return { success: true };
      }

      return {
        success: true,
        message: response.data.message || "Registration submitted successfully!",
      };
    } catch (error: any) {
      const msg = error.response?.data?.message || "Registration failed. Please check your details.";
      return { success: false, message: msg };
    }
  };

  const logout = async () => {
    try {
      await SecureStore.deleteItemAsync("auth_token");
      await SecureStore.deleteItemAsync("auth_user");
    } catch (_) {}
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get("/users/me");
      if (res.data?.success && res.data?.data) {
        setUser(res.data.data);
        await SecureStore.setItemAsync("auth_user", JSON.stringify(res.data.data));
      }
    } catch (_) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
