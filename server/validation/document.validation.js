import { z } from "zod";

export const createDocumentSchema = z.object({
  user_id: z.string().optional(),
  organization_id: z.string().optional(),
  document_type_id: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required").max(255),
  assigned_role: z.string().trim().optional(),
});

export const updateDocumentStatusSchema = z.object({
  status: z.enum(["draft", "pending", "approved", "rejected"]),
  assigned_role: z.string().trim().optional(),
});
