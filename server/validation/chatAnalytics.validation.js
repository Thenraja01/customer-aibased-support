import { z } from "zod";

export const createChatAnalyticsSchema = z.object({
  chat_id: z.string().trim().min(1),
  organization_id: z.string().trim().min(1),
  total_messages: z.number().int().min(0).optional(),
  ai_messages: z.number().int().min(0).optional(),
  human_messages: z.number().int().min(0).optional(),
  avg_response_time_ms: z.number().min(0).optional(),
  first_response_time_ms: z.number().min(0).optional(),
  resolution_time_ms: z.number().min(0).optional(),
  escalation_count: z.number().int().min(0).optional(),
});
