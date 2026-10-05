import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import * as SecureStore from "expo-secure-store";
import { apiClient } from "../api/client";
import { useAuth } from "./AuthContext";

export interface BrandColors {
  primary: string;
  secondary: string;
  accent: string;
}

export interface LoaderConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  duration_ms: number;
  bg_theme: "dark" | "light" | "gradient" | string;
}

export interface OrgDetails {
  _id?: string;
  organization_id?: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  plan?: string;
  status?: string;
}

export interface ThemeColors {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  primaryGlow: string;
  secondary: string;
  secondaryLight: string;
  secondaryGlow: string;
  accent: string;
  accentEmerald: string;
  accentAmber: string;
  accentRose: string;
  background: string;
  card: string;
  cardGlass: string;
  surface: string;
  surfaceLight: string;
  border: string;
  borderHighlight: string;
  text: string;
  textMuted: string;
  textDim: string;
  inputBg: string;
  tabBar: string;
}

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => Promise<void>;
  setThemeMode: (mode: "dark" | "light") => Promise<void>;
  brandColors: BrandColors;
  loaderConfig: LoaderConfig;
  appName: string;
  orgName: string;
  orgDetails: OrgDetails | null;
  chatbotName: string;
  greetingMessage: string;
  logoUrl?: string;
  refreshBrandSettings: () => Promise<void>;
}

const DEFAULT_BRAND_COLORS: BrandColors = {
  primary: "#2563eb",
  secondary: "#7c3aed",
  accent: "#f59e0b",
};

const DEFAULT_LOADER_CONFIG: LoaderConfig = {
  enabled: true,
  title: "",
  subtitle: "Build fast, ship faster",
  duration_ms: 2400,
  bg_theme: "dark",
};

// Helper to lighten/darken hex colors
function adjustColor(hex: string, percent: number): string {
  if (!hex || !hex.startsWith("#")) return hex;
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return (
    "#" +
    (
      0x1000000 +
      (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
      (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
      (B < 255 ? (B < 1 ? 0 : B) : 255)
    )
      .toString(16)
      .slice(1)
  );
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState<boolean>(true);
  const [dbBrandColors, setDbBrandColors] = useState<BrandColors>(DEFAULT_BRAND_COLORS);
  const [loaderConfig, setLoaderConfig] = useState<LoaderConfig>(DEFAULT_LOADER_CONFIG);
  const [appName, setAppName] = useState<string>("SupportAI");
  const [orgDetails, setOrgDetails] = useState<OrgDetails | null>(null);
  const [chatbotName, setChatbotName] = useState<string>("Support AI");
  const [greetingMessage, setGreetingMessage] = useState<string>("Hello! How can I help you today?");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);

  // Load saved dark/light preference
  useEffect(() => {
    SecureStore.getItemAsync("user_theme_mode").then((mode) => {
      if (mode) setIsDark(mode === "dark");
    });
  }, []);

  // Fetch Global App Settings & Tenant Branding from Database
  const fetchGlobalSettings = useCallback(async () => {
    try {
      const [appRes, orgsRes] = await Promise.all([
        apiClient.get("/auth/v1/app-settings").catch(() => null),
        apiClient.get("/auth/v1/organizations").catch(() => null),
      ]);

      if (appRes?.data?.success && appRes.data.data) {
        const d = appRes.data.data;
        if (d.app_name) setAppName(d.app_name);
        if (d.logo?.url) setLogoUrl(d.logo.url);
        if (d.brand_colors?.primary) {
          setDbBrandColors({
            primary: d.brand_colors.primary,
            secondary: d.brand_colors.secondary || DEFAULT_BRAND_COLORS.secondary,
            accent: d.brand_colors.accent || DEFAULT_BRAND_COLORS.accent,
          });
        }
      }

      // If organizations exist and no user logged in, use first active organization for branding
      if (orgsRes?.data?.success && Array.isArray(orgsRes.data.data) && orgsRes.data.data.length > 0) {
        const defaultOrg = orgsRes.data.data[0];
        if (defaultOrg) {
          if (defaultOrg.brand_colors?.primary) {
            setDbBrandColors({
              primary: defaultOrg.brand_colors.primary,
              secondary: defaultOrg.brand_colors.secondary || DEFAULT_BRAND_COLORS.secondary,
              accent: defaultOrg.brand_colors.accent || DEFAULT_BRAND_COLORS.accent,
            });
          }
          if (defaultOrg.loader_config) {
            setLoaderConfig({
              enabled: defaultOrg.loader_config.enabled ?? true,
              title: defaultOrg.loader_config.title || defaultOrg.name || "",
              subtitle: defaultOrg.loader_config.subtitle || "Build fast, ship faster",
              duration_ms: defaultOrg.loader_config.duration_ms || 2400,
              bg_theme: defaultOrg.loader_config.bg_theme || "dark",
            });
          }
          if (defaultOrg.chatbot_name) setChatbotName(defaultOrg.chatbot_name);
          if (defaultOrg.greeting_message) setGreetingMessage(defaultOrg.greeting_message);
          if (defaultOrg.logo?.url) setLogoUrl(defaultOrg.logo.url);
          setOrgDetails({
            _id: defaultOrg._id,
            organization_id: defaultOrg.organization_id,
            name: defaultOrg.name,
            email: defaultOrg.email,
            phone: defaultOrg.phone,
            address: defaultOrg.address,
            plan: defaultOrg.plan,
            status: defaultOrg.status,
          });
        }
      }
    } catch (_) {
      // Fallback
    }
  }, []);

  useEffect(() => {
    fetchGlobalSettings();
  }, [fetchGlobalSettings]);

  // If user belongs to an organization with custom branding, override with User's Org DB theme
  const effectiveBrand = useMemo(() => {
    const orgObj = typeof user?.organization_id === "object" ? (user?.organization_id as any) : null;
    const orgColors = orgObj?.brand_colors;

    if (orgColors?.primary) {
      return {
        primary: orgColors.primary,
        secondary: orgColors.secondary || dbBrandColors.secondary || DEFAULT_BRAND_COLORS.secondary,
        accent: orgColors.accent || dbBrandColors.accent || DEFAULT_BRAND_COLORS.accent,
      };
    }
    return dbBrandColors;
  }, [user, dbBrandColors]);

  const effectiveOrgName = useMemo(() => {
    const orgObj = typeof user?.organization_id === "object" ? (user?.organization_id as any) : null;
    return orgObj?.name || orgDetails?.name || appName || "SupportAI";
  }, [user, orgDetails, appName]);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await SecureStore.setItemAsync("user_theme_mode", next ? "dark" : "light");
  };

  const setThemeMode = async (mode: "dark" | "light") => {
    setIsDark(mode === "dark");
    await SecureStore.setItemAsync("user_theme_mode", mode);
  };

  const colors = useMemo<ThemeColors>(() => {
    const primary = effectiveBrand.primary || DEFAULT_BRAND_COLORS.primary;
    const secondary = effectiveBrand.secondary || DEFAULT_BRAND_COLORS.secondary;
    const accent = effectiveBrand.accent || DEFAULT_BRAND_COLORS.accent;

    const primaryLight = adjustColor(primary, 25);
    const primaryDark = adjustColor(primary, -25);
    const primaryGlow = `${primary}40`;
    const secondaryLight = adjustColor(secondary, 25);
    const secondaryGlow = `${secondary}40`;

    if (isDark) {
      return {
        primary,
        primaryLight,
        primaryDark,
        primaryGlow,
        secondary,
        secondaryLight,
        secondaryGlow,
        accent,
        accentEmerald: "#10b981",
        accentAmber: "#f59e0b",
        accentRose: "#f43f5e",
        background: "#080c14",
        card: "#0f172a",
        cardGlass: "rgba(15, 23, 42, 0.88)",
        surface: "#1e293b",
        surfaceLight: "#334155",
        border: "#1e293b",
        borderHighlight: "#334155",
        text: "#f8fafc",
        textMuted: "#94a3b8",
        textDim: "#64748b",
        inputBg: "#0f172a",
        tabBar: "rgba(15, 23, 42, 0.95)",
      };
    } else {
      return {
        primary,
        primaryLight,
        primaryDark,
        primaryGlow,
        secondary,
        secondaryLight,
        secondaryGlow,
        accent,
        accentEmerald: "#10b981",
        accentAmber: "#f59e0b",
        accentRose: "#f43f5e",
        background: "#f8fafc",
        card: "#ffffff",
        cardGlass: "rgba(255, 255, 255, 0.94)",
        surface: "#f1f5f9",
        surfaceLight: "#e2e8f0",
        border: "#e2e8f0",
        borderHighlight: "#cbd5e1",
        text: "#0f172a",
        textMuted: "#64748b",
        textDim: "#94a3b8",
        inputBg: "#ffffff",
        tabBar: "rgba(255, 255, 255, 0.96)",
      };
    }
  }, [isDark, effectiveBrand]);

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        colors,
        toggleTheme,
        setThemeMode,
        brandColors: effectiveBrand,
        loaderConfig,
        appName,
        orgName: effectiveOrgName,
        orgDetails,
        chatbotName,
        greetingMessage,
        logoUrl,
        refreshBrandSettings: fetchGlobalSettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
