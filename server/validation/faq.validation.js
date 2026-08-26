import { z } from "zod";

export const createFaqSchema = z.object({
  organization_id: z.string().trim().optional(),
  branch_id: z.string().trim().optional(),
  question: z.string().trim().min(1, "Question is required").max(500),
  answer: z.string().trim().min(1, "Answer is required").max(5000),
  category: z.string().trim().optional(),
  is_published: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

export const updateFaqSchema = z.object({
  question: z.string().trim().min(1).max(500).optional(),
  answer: z.string().trim().min(1).max(5000).optional(),
  category: z.string().trim().optional(),
  is_published: z.boolean().optional(),
  is_active: z.boolean().optional(),
  organization_id: z.string().trim().optional(),
  branch_id: z.string().trim().optional(),
});
