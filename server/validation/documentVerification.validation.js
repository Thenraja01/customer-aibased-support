import { z } from "zod";

export const createVerificationSchema = z.object({
  document_id: z.string().trim().min(1, "Document ID is required"),
  verified_by: z.string().trim().min(1, "Verifier ID is required"),
  remarks: z.string().trim().max(1000).optional(),
});

export const rejectVerificationSchema = z.object({
  remarks: z.string().trim().min(1, "Remarks are required for rejection").max(1000),
});
