import { z } from "zod";

export const ingestSchema = z.object({
  documentId: z.string().trim().min(1, "Document ID is required"),
  text: z.string().trim().min(1, "Text is required").max(1000000),
});

export const querySchema = z.object({
  query: z.string().trim().min(1, "Query is required").max(5000),
  documentId: z.string().trim().optional(),
  chatId: z.string().trim().optional(),
  userId: z.string().trim().optional(),
});
