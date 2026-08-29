import { z } from "zod";

export const createChatSchema = z.object({
  user_id: z.string().trim().min(1, "User ID is required"),
  organization_id: z.string().trim().min(1).nullable().optional(),
  topic: z.string().trim().max(255).optional(),
  is_copilot: z.boolean().optional(),
});

export const updateTopicSchema = z.object({
  topic: z.string().trim().min(1, "Topic is required").max(255),
});
