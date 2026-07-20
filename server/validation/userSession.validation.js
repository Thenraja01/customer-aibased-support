import { z } from "zod";

export const revokeSessionSchema = z.object({
  is_revoked: z.literal(true),
});
