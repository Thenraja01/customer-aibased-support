import { useState, useEffect } from "react";
import { AuthAPI } from "@/api/auth.api";
import { hexToHsl } from "@/lib/utils";

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

export async function fetchTenantSettings(): Promise<TenantOrg | null> {
  const tenantId = extractTenantId();
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

export function applyBrandColors(brand_colors?: { primary?: string; secondary?: string; accent?: string }) {
  if (!brand_colors) return;
  const root = document.documentElement;
  const { primary, secondary, accent } = brand_colors;
  if (primary) {
    root.style.setProperty("--primary", hexToHsl(primary));
    root.style.setProperty("--ring", hexToHsl(primary));
    root.style.setProperty("--brand-primary", primary);
  }
  if (secondary) {
    root.style.setProperty("--secondary", hexToHsl(secondary));
    root.style.setProperty("--brand-secondary", secondary);
  }
  if (accent) {
    root.style.setProperty("--accent", hexToHsl(accent));
    root.style.setProperty("--brand-accent", accent);
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
