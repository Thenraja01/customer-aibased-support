import { z } from "zod";

export const createBulkOperationSchema = z.object({
  operation_type: z.enum(["upload", "delete", "update", "verify"]),
  total_records: z.number().int().min(1).optional(),
});
