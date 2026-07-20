import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/store';

/**
 * BrandingInjector Component
 *
 * Reads ui_config from Redux after login and injects CSS custom properties
 * into document.documentElement so the Tailwind design system picks them up.
 *
 * Wires:
 *   --primary / --ring / --accent  ← branding.primary_color
 *   --secondary                    ← branding.secondary_color
 *   --brand-font                   ← branding.font_family (body font-family override)
 *   document.title                 ← branding.app_name
 *   favicon                        ← branding.favicon_url
 */

/** Convert a hex colour (#rrggbb / #rgb) to "H S% L%" for CSS HSL vars */
function hexToHsl(hex: string): string | null {
  const clean = hex.replace('#', '');
  if (clean.length !== 6 && clean.length !== 3) return null;
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function BrandingInjector() {
  const uiConfig = useSelector((state: RootState) => state.auth?.ui_config ?? state.ui?.ui_config);

  useEffect(() => {
    if (!uiConfig?.branding) return;

    const { branding } = uiConfig;
    const root = document.documentElement;

    // --- Primary color → --primary, --ring, --accent, --sidebar-primary ---
    if (branding.primary_color) {
      const hsl = hexToHsl(branding.primary_color);
      if (hsl) {
        root.style.setProperty('--primary', hsl);
        root.style.setProperty('--ring', hsl);
        root.style.setProperty('--accent', hsl);
        root.style.setProperty('--sidebar-primary', hsl);
        root.style.setProperty('--sidebar-ring', hsl);
      }
      // Also expose raw hex for non-tailwind usages
      root.style.setProperty('--brand-primary', branding.primary_color);
    }

    // --- Secondary color ---
    if (branding.secondary_color) {
      const hsl = hexToHsl(branding.secondary_color);
      if (hsl) {
        root.style.setProperty('--secondary', hsl);
      }
      root.style.setProperty('--brand-secondary', branding.secondary_color);
    }

    // --- Font family ---
    if (branding.font_family) {
      root.style.setProperty('--brand-font', branding.font_family);
      document.body.style.fontFamily = `'${branding.font_family}', var(--font-sans, system-ui, sans-serif)`;
    }

    // --- Page title ---
    if (branding.app_name) {
      document.title = branding.app_name;
    }

    // --- Favicon ---
    if (branding.favicon_url) {
      let favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = branding.favicon_url;
    }

    return () => {
      // Reset on logout / ui_config cleared
      root.style.removeProperty('--primary');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--sidebar-primary');
      root.style.removeProperty('--sidebar-ring');
      root.style.removeProperty('--secondary');
      root.style.removeProperty('--brand-primary');
      root.style.removeProperty('--brand-secondary');
      root.style.removeProperty('--brand-font');
      document.body.style.fontFamily = '';
    };
  }, [uiConfig]);

  return null;
}

export default BrandingInjector;
