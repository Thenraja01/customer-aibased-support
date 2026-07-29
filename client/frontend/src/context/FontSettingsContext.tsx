import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";

export type FontSize = "small" | "medium" | "large" | "x-large";
export type FontFamily = "system" | "sans" | "serif" | "mono" | "dyslexic";

interface FontSettings {
  fontSize: FontSize;
  fontFamily: FontFamily;
  lineHeight: number;
  letterSpacing: number;
}

interface FontSettingsContextType {
  settings: FontSettings;
  setFontSize: (size: FontSize) => void;
  setFontFamily: (family: FontFamily) => void;
  setLineHeight: (height: number) => void;
  setLetterSpacing: (spacing: number) => void;
  resetToDefaults: () => void;
}

const FONT_SIZE_MAP: Record<FontSize, number> = {
  small: 0.875,
  medium: 1,
  large: 1.125,
  "x-large": 1.25,
};

const FONT_FAMILY_MAP: Record<FontFamily, string> = {
  system: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  sans: "'Inter Variable', 'IBM Plex Sans Variable', 'Source Sans 3 Variable', sans-serif",
  serif: "'Merriweather', Georgia, 'Times New Roman', serif",
  mono: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
  dyslexic: "'OpenDyslexic', 'OpenDyslexicAlta', sans-serif",
};

const DEFAULTS: FontSettings = {
  fontSize: "medium",
  fontFamily: "sans",
  lineHeight: 1.6,
  letterSpacing: 0,
};

const STORAGE_KEY = "fontSettings";

function loadSettings(): FontSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULTS, ...parsed };
    }
  } catch {}
  return { ...DEFAULTS };
}

function saveSettings(settings: FontSettings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {}
}

function applySettings(settings: FontSettings) {
  const root = document.documentElement;
  const scale = FONT_SIZE_MAP[settings.fontSize];
  root.style.setProperty("--font-size-scale", String(scale));
  root.style.setProperty("--font-family-custom", FONT_FAMILY_MAP[settings.fontFamily]);
  root.style.setProperty("--line-height-custom", String(settings.lineHeight));
  root.style.setProperty("--letter-spacing-custom", `${settings.letterSpacing}px`);
  root.dataset.fontSize = settings.fontSize;
  root.dataset.fontFamily = settings.fontFamily;
}

const FontSettingsContext = createContext<FontSettingsContextType | null>(null);

export function FontSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<FontSettings>(loadSettings);

  useEffect(() => {
    applySettings(settings);
    saveSettings(settings);
  }, [settings]);

  const setFontSize = useCallback((fontSize: FontSize) => {
    setSettings((prev) => ({ ...prev, fontSize }));
  }, []);

  const setFontFamily = useCallback((fontFamily: FontFamily) => {
    setSettings((prev) => ({ ...prev, fontFamily }));
  }, []);

  const setLineHeight = useCallback((lineHeight: number) => {
    setSettings((prev) => ({ ...prev, lineHeight }));
  }, []);

  const setLetterSpacing = useCallback((letterSpacing: number) => {
    setSettings((prev) => ({ ...prev, letterSpacing }));
  }, []);

  const resetToDefaults = useCallback(() => {
    setSettings({ ...DEFAULTS });
  }, []);

  return (
    <FontSettingsContext.Provider
      value={{ settings, setFontSize, setFontFamily, setLineHeight, setLetterSpacing, resetToDefaults }}
    >
      {children}
    </FontSettingsContext.Provider>
  );
}

export function useFontSettings() {
  const ctx = useContext(FontSettingsContext);
  if (!ctx) throw new Error("useFontSettings must be inside FontSettingsProvider");
  return ctx;
}

export { FONT_SIZE_MAP, FONT_FAMILY_MAP, DEFAULTS };
export type { FontSettings };
