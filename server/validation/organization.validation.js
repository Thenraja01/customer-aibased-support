import { z } from "zod";

export const createOrganizationSchema = z.object({
  organization_id: z.string().trim().min(1, "Organization ID is required").max(50),
  name: z.string().trim().min(1, "Name is required").max(255),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Invalid email").max(255),
});

export const updateOrganizationSchema = z.object({
  name: z.string().trim().min(1).max(255).optional(),
  address: z.string().trim().max(500).optional(),
  phone: z.string().trim().max(20).optional(),
  email: z.string().trim().email("Invalid email").max(255).optional(),
});
