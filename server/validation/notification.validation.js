import { z } from "zod";

export const createNotificationSchema = z.object({
  user_id: z.string().trim().min(1, "User ID is required"),
  title: z.string().trim().min(1, "Title is required").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
  type: z.enum(["info", "warning", "success", "error"]).optional(),
  link: z.string().max(500).optional(),
});

export const broadcastNotificationSchema = z.object({
  userIds: z
    .array(z.string().trim())
    .min(1, "At least one user ID is required"),
  title: z.string().trim().min(1, "Title is required").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
  type: z.enum(["info", "warning", "success", "error"]).optional(),
  link: z.string().max(500).optional(),
});

export const broadcastToOrgSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  message: z.string().trim().min(1, "Message is required").max(2000),
  type: z.enum(["info", "warning", "success", "error"]).optional(),
  link: z.string().max(500).optional(),
  audienceType: z.enum(["all", "branch", "role", "branch_role"]).optional(),
  branchIds: z.array(z.string()).optional(),
  roleIds: z.array(z.string()).optional(),
  deliveryMethods: z.array(z.string()).optional(),
  ctaText: z.string().optional(),
  ctaUrl: z.string().optional(),
});
