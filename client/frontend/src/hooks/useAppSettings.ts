import { useState, useEffect } from "react";
import { AuthAPI } from "@/api/auth.api";

interface AppSettings {
  _id: string;
  app_name?: string;
  logo?: { url?: string; public_id?: string };
  favicon_url?: string;
  brand_colors?: { primary?: string; secondary?: string; accent?: string };
  marketing?: {
    hero_title?: string;
    hero_subtitle?: string;
    hero_cta_text?: string;
    features_title?: string;
    features?: Array<{ title: string; description: string; icon: string }>;
    footer_text?: string;
  };
  login_page?: { title?: string; subtitle?: string };
  legal?: { about_text?: string; privacy_policy?: string; terms_of_service?: string };
}

export function useAppSettings() {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const fetchSettings = async () => {
      try {
        const res: any = await (AuthAPI as any).getAppSettings();
        if (mounted && res.data.success) {
          setSettings(res.data.data);
        }
      } catch {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchSettings();
    return () => { mounted = false; };
  }, []);

  return { settings, loading };
}
