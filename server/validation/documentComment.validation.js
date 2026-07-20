import { z } from "zod";

export const createDocumentCommentSchema = z.object({
  document_id: z.string().trim().min(1),
  comment: z.string().trim().min(1).max(1000),
  parent_id: z.string().trim().optional(),
});

export const updateDocumentCommentSchema = z.object({
  comment: z.string().trim().min(1).max(1000).optional(),
  is_resolved: z.boolean().optional(),
});
