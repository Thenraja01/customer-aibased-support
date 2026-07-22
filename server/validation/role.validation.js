import { z } from "zod";

const notSuperAdmin = (val) => val.toLowerCase() !== "super admin" || "Cannot use 'super admin' as role name";

export const createRoleSchema = z.object({
  role_name: z.string().trim().min(1, "Role name is required").max(50).refine(notSuperAdmin),
  permissions: z.array(z.string().max(100)).default([]),
  status: z.enum(["active", "inactive"]).default("active"),
  description: z.string().max(200).default(""),
});

export const updateRoleSchema = z.object({
  role_name: z.string().trim().min(1, "Role name is required").max(50).refine(notSuperAdmin).optional(),
  permissions: z.array(z.string().max(100)).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  description: z.string().max(200).optional(),
});
