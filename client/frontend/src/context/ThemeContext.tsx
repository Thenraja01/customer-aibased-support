import { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark";
export type ThemeMode = "light" | "dark" | "glass" | "neon" | "midnight" | "system";
export type AccentColor = "terracotta" | "emerald" | "cyan" | "blue" | "violet" | "amber" | "rose";

export interface AccentColorConfig {
  id: AccentColor;
  label: string;
  primaryHsl: string;
  ringHsl: string;
  hex: string;
}

export const ACCENT_COLORS: AccentColorConfig[] = [
  { id: "terracotta", label: "Terracotta Rust", primaryHsl: "16 67% 55%", ringHsl: "16 67% 55%", hex: "#d8653e" },
  { id: "emerald", label: "Emerald AI", primaryHsl: "160 84% 39%", ringHsl: "160 84% 39%", hex: "#10b981" },
  { id: "cyan", label: "Electric Cyan", primaryHsl: "189 94% 43%", ringHsl: "189 94% 43%", hex: "#06b6d4" },
  { id: "blue", label: "Royal Blue", primaryHsl: "217 91% 60%", ringHsl: "217 91% 60%", hex: "#3b82f6" },
  { id: "violet", label: "Deep Violet", primaryHsl: "262 83% 58%", ringHsl: "262 83% 58%", hex: "#8b5cf6" },
  { id: "amber", label: "Sunset Amber", primaryHsl: "38 92% 50%", ringHsl: "38 92% 50%", hex: "#f59e0b" },
  { id: "rose", label: "Crimson Rose", primaryHsl: "347 77% 50%", ringHsl: "347 77% 50%", hex: "#f43f5e" },
];

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setAccentColor: (color: AccentColor) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(() => {
    const stored = localStorage.getItem("theme_mode") as ThemeMode | null;
    if (stored) return stored;
    const oldTheme = localStorage.getItem("theme");
    if (oldTheme === "dark" || oldTheme === "light") return oldTheme;
    return "dark";
  });

  const [accentColor, setAccentColorState] = useState<AccentColor>(() => {
    const stored = localStorage.getItem("theme_accent") as AccentColor | null;
    return stored || "terracotta";
  });

  // Calculate actual effective theme (light vs dark/midnight/glass/neon)
  const getEffectiveTheme = useCallback((): Theme => {
    if (themeMode === "system") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    if (themeMode === "midnight" || themeMode === "dark" || themeMode === "glass" || themeMode === "neon") return "dark";
    return "light";
  }, [themeMode]);

  const [theme, setTheme] = useState<Theme>(getEffectiveTheme);

  useEffect(() => {
    const effective = getEffectiveTheme();
    setTheme(effective);

    const root = document.documentElement;
    root.classList.remove("light", "dark", "midnight", "glass", "neon");

    if (themeMode === "glass") {
      root.classList.add("dark", "glass");
    } else if (themeMode === "neon") {
      root.classList.add("dark", "neon");
    } else if (themeMode === "midnight") {
      root.classList.add("dark", "midnight");
    } else {
      root.classList.add(effective);
    }

    const config = ACCENT_COLORS.find((a) => a.id === accentColor);
    if (config) {
      root.style.setProperty("--primary", config.primaryHsl);
      root.style.setProperty("--ring", config.ringHsl);
      root.style.setProperty("--sidebar-primary", config.primaryHsl);
    }

    root.dataset.themeMode = themeMode;
    root.dataset.accent = accentColor;
    localStorage.setItem("theme_mode", themeMode);
    localStorage.setItem("theme", effective);
    localStorage.setItem("theme_accent", accentColor);
  }, [themeMode, accentColor, getEffectiveTheme]);

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  const setThemeMode = useCallback((mode: ThemeMode) => {
    setThemeModeState(mode);
  }, []);

  const setAccentColor = useCallback((color: AccentColor) => {
    setAccentColorState(color);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        accentColor,
        toggleTheme,
        setThemeMode,
        setAccentColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
