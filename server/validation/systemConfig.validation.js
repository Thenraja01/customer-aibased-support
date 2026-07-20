import { z } from "zod";

export const createSystemConfigSchema = z.object({
  key: z.string().trim().min(1).max(100),
  value: z.any(),
  description: z.string().trim().max(500).optional(),
  is_editable: z.boolean().optional(),
});

export const updateSystemConfigSchema = z.object({
  value: z.any(),
  description: z.string().trim().max(500).optional(),
  is_editable: z.boolean().optional(),
});
