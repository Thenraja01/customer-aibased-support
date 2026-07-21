import { z } from "zod";

export const createDocumentSchema = z.object({
  user_id: z.string().optional(),
  organization_id: z.string().optional(),
  document_type_id: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required").max(255),
});

export const updateDocumentStatusSchema = z.object({
  status: z.enum(["pending", "approved", "rejected"]),
});
