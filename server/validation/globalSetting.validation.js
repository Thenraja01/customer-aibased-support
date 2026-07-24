import { z } from "zod";

const featureSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  icon: z.string().optional(),
});

export const updateGlobalSettingsSchema = z.object({
  app_name: z.string().trim().max(100).optional(),
  logo: z
    .object({
      url: z.string().optional(),
      public_id: z.string().optional(),
    })
    .optional(),
  favicon_url: z.string().optional(),
  brand_colors: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
    })
    .optional(),
  marketing: z
    .object({
      hero_title: z.string().max(255).optional(),
      hero_subtitle: z.string().max(500).optional(),
      hero_cta_text: z.string().max(100).optional(),
      features_title: z.string().max(255).optional(),
      features: z.array(featureSchema).optional(),
      footer_text: z.string().optional(),
    })
    .optional(),
  login_page: z
    .object({
      title: z.string().max(255).optional(),
      subtitle: z.string().max(500).optional(),
    })
    .optional(),
  legal: z
    .object({
      about_text: z.string().optional(),
      privacy_policy: z.string().optional(),
      terms_of_service: z.string().optional(),
    })
    .optional(),
});
