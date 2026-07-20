import { z } from "zod";

export const createAccessControlSchema = z.object({
  document_id: z.string().trim().min(1),
  role_id: z.string().trim().optional(),
  user_id: z.string().trim().optional(),
  permission: z.enum(["view", "edit", "delete", "verify"]),
});
