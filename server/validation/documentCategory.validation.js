import { z } from "zod";

export const createDocumentCategorySchema = z.object({
  organization_id: z.string().trim().min(1),
  name: z.string().trim().min(1).max(100),
  description: z.string().trim().max(500).optional(),
  color: z.string().trim().optional(),
  is_active: z.boolean().optional(),
});

export const updateDocumentCategorySchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(500).optional(),
  color: z.string().trim().optional(),
  is_active: z.boolean().optional(),
});
