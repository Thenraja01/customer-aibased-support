import { z } from "zod";

const notSuperAdmin = (val) => val.toLowerCase() !== "super_admin" || "Cannot use 'super admin' as role name";

export const createRoleSchema = z.object({
  role_name: z.string().trim().min(1, "Role name is required").max(50).refine(notSuperAdmin),
  organization_id: z.string().optional(),
  level: z.number().int().min(0).max(9).default(3),
  status: z.enum(["active", "inactive"]).default("active"),
  description: z.string().max(200).default(""),
});

export const updateRoleSchema = z.object({
  role_name: z.string().trim().min(1, "Role name is required").max(50).refine(notSuperAdmin).optional(),
  organization_id: z.string().optional(),
  level: z.number().int().min(0).max(9).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  description: z.string().max(200).optional(),
});
