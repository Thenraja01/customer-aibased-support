import { z } from "zod";

export const createNotificationSchema = z.object({
  user_id: z.string().trim().min(1, "User ID is required"),
  title: z.string().trim().min(1, "Title is required").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
  type: z.enum(["info", "warning", "success", "error"]).optional(),
});

export const broadcastNotificationSchema = z.object({
  userIds: z
    .array(z.string().trim())
    .min(1, "At least one user ID is required"),
  title: z.string().trim().min(1, "Title is required").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
  type: z.enum(["info", "warning", "success", "error"]).optional(),
});
