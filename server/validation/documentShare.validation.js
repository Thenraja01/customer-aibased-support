import { z } from "zod";

export const createDocumentShareSchema = z.object({
  document_id: z.string().trim().min(1),
  shared_with: z.string().trim().min(1),
  permission: z.enum(["view", "edit", "download"]).optional(),
  expires_at: z.string().datetime().optional(),
});

export const updateDocumentShareSchema = z.object({
  permission: z.enum(["view", "edit", "download"]).optional(),
  expires_at: z.string().datetime().optional(),
});
