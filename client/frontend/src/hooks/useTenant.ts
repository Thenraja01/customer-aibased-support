import { useState, useEffect } from "react";
import { AuthAPI } from "@/api/auth.api";

export interface TenantOrg {
  _id: string;
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  logo?: { url?: string; public_id?: string };
  brand_colors?: { primary?: string; secondary?: string; accent?: string };
  chatbot_name?: string;
  greeting_message?: string;
  default_language?: string;
  domain?: string;
  [key: string]: any;
}

function extractTenantId(): string | null {
  const params = new URLSearchParams(window.location.search);
  const tenantParam = params.get("tenant");
  if (tenantParam) return tenantParam.trim().toLowerCase();

  const hostname = window.location.hostname;
  if (hostname === "localhost" || hostname === "127.0.0.1") return null;
  const parts = hostname.split(".");
  if (parts.length < 3) return null;
  const subdomain = parts[0];
  if (subdomain === "www") return parts.length > 3 ? parts[1] : null;
  return subdomain;
}

export async function fetchTenantSettings(tenantIdOrOrgId?: string): Promise<TenantOrg | null> {
  const tenantId = tenantIdOrOrgId || extractTenantId();
  if (!tenantId) return null;

  try {
    const res = await (AuthAPI as any).getOrgByDomain(tenantId);
    if (res.data.success) {
      return res.data.data as TenantOrg;
    }
  } catch {
    return null;
  }
  return null;
}

export function hexToHsl(hex: string): string | null {
  if (!hex || typeof hex !== "string") return null;
  let clean = hex.replace(/^#/, "").trim();
  if (clean.length === 3) {
    clean = clean.split("").map((c) => c + c).join("");
  }
  if (clean.length !== 6) return null;

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function applyBrandColors(brand_colors?: { primary?: string; secondary?: string; accent?: string }) {
  if (!brand_colors) return;
  const root = document.documentElement;

  if (brand_colors.primary) {
    const hsl = hexToHsl(brand_colors.primary);
    if (hsl) {
      root.style.setProperty("--primary", hsl);
      root.style.setProperty("--brand-primary", brand_colors.primary);
    }
  }

  if (brand_colors.secondary) {
    const hsl = hexToHsl(brand_colors.secondary);
    if (hsl) {
      root.style.setProperty("--brand-secondary", brand_colors.secondary);
    }
  }

  if (brand_colors.accent) {
    const hsl = hexToHsl(brand_colors.accent);
    if (hsl) {
      root.style.setProperty("--brand-accent", brand_colors.accent);
    }
  }
}

export function useTenant() {
  const [tenant, setTenant] = useState<TenantOrg | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const detectTenant = async () => {
      const data = await fetchTenantSettings();
      if (cancelled) return;

      if (data) {
        setTenant(data);
        applyBrandColors(data.brand_colors);
      }
      if (!cancelled) setLoading(false);
    };

    detectTenant();

    return () => { cancelled = true; };
  }, []);

  return { tenant, loading };
}
