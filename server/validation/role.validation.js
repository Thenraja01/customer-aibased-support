import { z } from "zod";

export const createRoleSchema = z.object({
  role_name: z.string().trim().min(1, "Role name is required").max(50),
});

export const updateRoleSchema = z.object({
  role_name: z.string().trim().min(1, "Role name is required").max(50),
});
