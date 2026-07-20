import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  document_type_id: z.string().trim().optional(),
  description: z.string().trim().max(1000).optional(),
  is_knowledge_base: z.union([z.boolean(), z.string()]).optional(),
});

export const updateDocumentStatusSchema = z.object({
  status: z.enum(["draft", "pending_review", "approved", "rejected", "archived"]),
});
