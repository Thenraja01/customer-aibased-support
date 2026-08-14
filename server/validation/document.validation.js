import { z } from "zod";

const VISIBILITY_VALUES = ["branch", "organization", "private", "customer_visible", "support_only"];

export const createDocumentSchema = z.object({
  user_id: z.string().optional(),
  organization_id: z.string().optional(),
  document_type_id: z.string().trim().optional(),
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(2000).optional().default(""),
  assigned_role: z.string().trim().optional(),
  branch_id: z
    .string()
    .trim()
    .refine((v) => v === "" || v === "all" || v === "ALL" || /^[0-9a-fA-F]{24}$/.test(v), {
      message: "Invalid branch_id",
    })
    .optional(),
  visibility: z.enum(VISIBILITY_VALUES).optional(),
  allowed_roles: z
    .union([
      z.array(z.string().trim().min(1)),
      z.string().trim().min(1),
    ])
    .optional(),
  accessPolicy: z
    .object({
      audience: z.array(z.string().trim().min(1)).optional(),
      customerVisible: z.boolean().optional(),
    })
    .optional(),
  customerVisible: z.boolean().optional(),
  role_ids: z
    .union([
      z.array(z.string().trim().min(1)),
      z.string().trim().min(1),
    ])
    .optional(),
});

export const updateDocumentStatusSchema = z.object({
  status: z.enum([
    "uploaded",
    "processing",
    "ready_for_review",
    "pending_approval",
    "approved",
    "rejected",
    "needs_revision",
    "published",
    "archived",
    // Legacy statuses (kept for backward compat during migration)
    "draft",
    "pending",
  ]),
  assigned_role: z.string().trim().optional(),
  remarks: z.string().trim().max(1000).optional(),
});
