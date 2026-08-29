import { z } from "zod";

export const createTicketSchema = z.object({
  user_id: z.string().trim().optional(),
  organization_id: z.string().trim().optional(),
  branch_id: z.string().trim().optional(),
  assigned_to: z.string().trim().optional(),
  subject: z.string().trim().min(1, "Subject is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(5000),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  category: z
    .enum([
      "bug",
      "feature_request",
      "question",
      "billing",
      "account",
      "complaint",
      "refund",
      "technical_issue",
      "technical",
      "sales_inquiry",
      "password_reset",
      "general",
      "other",
    ])
    .optional(),
  subcategory: z.string().trim().max(100).optional(),
  source: z.enum(["customer", "chat", "escalation", "email", "api"]).optional(),
  linked_previous_ticket_id: z.string().trim().optional(),
  custom_fields: z.record(z.any()).optional(),
  phone: z.string().trim().optional(),
  order_id: z.string().trim().optional(),
});

export const assignTicketSchema = z.object({
  supportId: z.string().trim().min(1, "Support ID is required"),
});

export const updatePrioritySchema = z.object({
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export const ticketMessageSchema = z.object({
  content: z.string().trim().min(1, "Message is required").max(10000),
  is_internal: z.boolean().optional(),
  attachments: z
    .array(
      z.object({
        file_name: z.string().optional(),
        file_url: z.string().optional(),
        file_type: z.string().optional(),
        file_size: z.number().optional(),
      })
    )
    .max(20)
    .optional(),
});

export const ticketActionSchema = z.object({
  reason: z.string().trim().max(2000).optional(),
  target: z.enum(["support", "branch_admin", "admin"]).optional(),
});