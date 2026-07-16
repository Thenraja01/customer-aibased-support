import { z } from "zod";

export const storeMemorySchema = z.object({
  user_id: z.string().trim().min(1, "User ID is required"),
  chat_id: z.string().trim().optional(),
  memory_type: z.enum(["fact", "preference", "summary", "pattern", "context"]),
  content: z.string().trim().min(1, "Content is required").max(2000),
  keywords: z.array(z.string().trim()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  ttl_days: z.number().min(1).max(3650).optional(),
});

export const updateMemorySchema = z.object({
  content: z.string().trim().min(1).max(2000).optional(),
  memory_type: z.enum(["fact", "preference", "summary", "pattern", "context"]).optional(),
  keywords: z.array(z.string().trim()).optional(),
  confidence: z.number().min(0).max(1).optional(),
  is_active: z.boolean().optional(),
});
