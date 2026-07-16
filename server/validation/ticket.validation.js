import { z } from "zod";

export const createTicketSchema = z.object({
  user_id: z.string().trim().min(1, "User ID is required"),
  organization_id: z.string().trim().min(1, "Organization ID is required"),
  assigned_to: z.string().trim().optional(),
  subject: z.string().trim().min(1, "Subject is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(5000),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
});

export const assignTicketSchema = z.object({
  agentId: z.string().trim().min(1, "Agent ID is required"),
});

export const updatePrioritySchema = z.object({
  priority: z.enum(["low", "medium", "high", "urgent"]),
});
