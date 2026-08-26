import { z } from "zod";

export const createIncidentSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().min(1, "Description is required").max(5000),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  affected_service: z.string().trim().max(255).optional(),
  branch_id: z.string().trim().optional(),
  owner: z.string().trim().optional(),
});

export const updateIncidentSchema = z.object({
  title: z.string().trim().max(255).optional(),
  description: z.string().trim().max(5000).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  affected_service: z.string().trim().max(255).optional(),
  owner: z.string().trim().optional(),
  note: z.string().trim().max(2000).optional(),
});

export const incidentStatusSchema = z.object({
  status: z.enum(["detected", "investigating", "identified", "mitigating", "resolved", "closed"]),
  note: z.string().trim().max(2000).optional(),
});

export const linkTicketsSchema = z.object({
  ticketIds: z.array(z.string().trim().min(1)).min(1, "At least one ticket id is required"),
});