import { z } from "zod";

export const sendMessageSchema = z.object({
  chat_id: z.string().trim().min(1, "Chat ID is required"),
  sender_id: z.string().trim().min(1, "Sender ID is required"),
  content: z.string().trim().min(1, "Content is required").max(10000),
  message_type: z.enum(["text", "image", "file", "system"]).optional(),
  is_ai: z.boolean().optional(),
});

export const updateMessageSchema = z.object({
  content: z.string().trim().min(1, "Content is required").max(10000),
});
