import { z } from "zod";

const emailSchema = z.string().trim().email("Invalid email format").max(100);
const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password must not exceed 128 characters");

export const registerSchema = z.object({
  organization_id: z.string().trim().min(1, "Organization is required"),
  role_id: z.string().trim().min(1, "Role is required"),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: emailSchema,
  phone: z.string().trim().max(20).optional(),
  password: passwordSchema,
  dob: z.string().optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
  organization_id: z.string().trim().min(1, "Organization is required").optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});
