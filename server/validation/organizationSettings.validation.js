import { z } from "zod";

const workingDaySchema = z.object({
  open: z.string().optional(),
  close: z.string().optional(),
  enabled: z.boolean().optional(),
});

export const updateOrganizationSettingsSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email().max(255).optional(),
  domain: z.string().trim().max(255).optional(),
  customPrompt: z.string().optional(),
  chatbot_name: z.string().trim().max(100).optional(),
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
  show_charts: z.boolean().optional(),
  ai_session_logging: z.boolean().optional(),
  default_language: z.string().trim().max(10).optional(),
  greeting_message: z.string().max(500).optional(),
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
  ai_settings: z
    .object({
      temperature: z.number().min(0).max(2).optional(),
      top_k: z.number().int().min(1).optional(),
      similarity_threshold: z.number().min(0).max(1).optional(),
      max_tokens: z.number().int().min(64).optional(),
      response_style: z.enum(["concise", "balanced", "detailed"]).optional(),
    })
    .optional(),
  guardrails: z
    .array(
      z.object({
        rule: z.string(),
        enabled: z.boolean(),
      })
    )
    .optional(),
  working_hours: z
    .object({
      timezone: z.string().optional(),
      monday: workingDaySchema.optional(),
      tuesday: workingDaySchema.optional(),
      wednesday: workingDaySchema.optional(),
      thursday: workingDaySchema.optional(),
      friday: workingDaySchema.optional(),
      saturday: workingDaySchema.optional(),
      sunday: workingDaySchema.optional(),
    })
    .optional(),
  email_templates: z
    .object({
      ticket_created: z
        .object({
          subject: z.string().optional(),
          body: z.string().optional(),
        })
        .optional(),
      ticket_assigned: z
        .object({
          subject: z.string().optional(),
          body: z.string().optional(),
        })
        .optional(),
      ticket_resolved: z
        .object({
          subject: z.string().optional(),
          body: z.string().optional(),
        })
        .optional(),
      ai_escalation: z
        .object({
          subject: z.string().optional(),
          body: z.string().optional(),
        })
        .optional(),
      sla_warning: z
        .object({
          subject: z.string().optional(),
          body: z.string().optional(),
        })
        .optional(),
      announcement_update: z
        .object({
          subject: z.string().optional(),
          body: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
  rag_config: z
    .object({
      chunk_size: z.number().int().min(50).max(8000).optional(),
      chunk_overlap: z.number().int().min(0).max(2000).optional(),
      top_k: z.number().int().min(1).max(100).optional(),
      min_score: z.number().min(0).max(1).optional(),
      rerank_enabled: z.boolean().optional(),
      rerank_model: z.string().optional(),
      embedding_provider: z.string().optional(),
      embedding_model: z.string().optional(),
      bfs_max_depth: z.number().int().min(1).max(10).optional(),
      bfs_max_nodes: z.number().int().min(1).max(100).optional(),
      query_cache_ttl_ms: z.number().int().min(0).max(86400000).optional(),
    })
    .optional(),
  llm_config: z
    .object({
      provider: z.string().optional(),
      model_name: z.string().optional(),
      gemini_api_key: z.string().optional(),
      groq_api_key: z.string().optional(),
      openai_api_key: z.string().optional(),
      grok_api_key: z.string().optional(),
      claude_api_key: z.string().optional(),
    })
    .optional(),
  custom_fields: z
    .array(
      z.object({
        name: z.string(),
        label: z.string(),
        type: z.enum(["text", "number", "select", "checkbox", "date"]),
        options: z.array(z.string()).optional(),
        required: z.boolean().optional(),
        order: z.number().optional(),
      })
    )
    .optional(),
  plan: z.enum(["free", "starter", "business", "enterprise"]).optional(),
  status: z.enum(["active", "suspended"]).optional(),
});
