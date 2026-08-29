import { z } from "zod";

export const createOrganizationSchema = z.object({
  organization_id: z.string().trim().min(1, "Organization ID is required").max(50),
  name: z.string().trim().min(1, "Name is required").max(255),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Invalid email").max(255),
  domain: z.string().trim().max(255).optional().nullable(),
  customPrompt: z.string().optional(),
  status: z.enum(["active", "inactive", "suspended", "DELETION_PENDING"]).optional(),
  plan: z.enum(["free", "starter", "business", "enterprise"]).optional(),
  allowed_registration_roles: z.array(z.string()).optional(),
  plan_customization: z.record(z.any()).optional(),
  storage_limit: z.number().optional(),
  ai_requests_limit: z.number().optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Invalid email").max(255).optional(),
  domain: z.string().trim().max(255).optional().nullable(),
  status: z.enum(["active", "inactive", "suspended", "DELETION_PENDING"]).optional(),
  plan: z.enum(["free", "starter", "business", "enterprise"]).optional(),
  allowed_registration_roles: z.array(z.string()).optional(),
  plan_customization: z.record(z.any()).optional(),
  storage_limit: z.number().optional(),
  ai_requests_limit: z.number().optional(),
  default_branch_id: z.string().optional().nullable(),
  allowed_domains: z.array(z.string()).optional(),
  subscription_end: z.string().or(z.date()).optional().nullable(),
  chatbot_name: z.string().trim().max(100).optional(),
  default_language: z.string().trim().max(10).optional(),
  greeting_message: z.string().max(500).optional(),
  customPrompt: z.string().optional(),
  logo: z
    .object({
      url: z.string().optional(),
      public_id: z.string().optional(),
    })
    .optional(),
  brand_colors: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      accent: z.string().optional(),
    })
    .optional(),
  chart_colors: z
    .object({
      primary: z.string().optional(),
      secondary: z.string().optional(),
      tertiary: z.string().optional(),
      quaternary: z.string().optional(),
      grid: z.string().optional(),
      text: z.string().optional(),
      background: z.string().optional(),
    })
    .optional(),
  ai_settings: z
    .object({
      temperature: z.number().optional(),
      top_k: z.number().optional(),
      similarity_threshold: z.number().optional(),
      max_tokens: z.number().optional(),
      response_style: z.string().optional(),
    })
    .optional(),
  llm_config: z.record(z.any()).optional(),
  rag_config: z.record(z.any()).optional(),
  working_hours: z.record(z.any()).optional(),
  email_templates: z.record(z.any()).optional(),
});
