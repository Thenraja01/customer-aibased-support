import { z } from "zod";

export const submitFeedbackSchema = z.object({
  chat_id: z.string().trim().min(1, "Chat ID is required"),
  rating: z.number().int().min(1).max(5, "Rating must be between 1 and 5"),
  message: z.string().trim().max(500).optional(),
  category: z.enum(["general", "bug", "feature", "performance"]).optional(),
});