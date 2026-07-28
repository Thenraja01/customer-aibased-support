import { z } from "zod";

export const createUserSchema = z.object({
  organization_id: z.string().trim().min(1, "Organization is required"),
  role_id: z.string().trim().min(1, "Role is required"),
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(100),
  phone: z.string().trim().max(20).optional(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
  dob: z.string().optional(),
  auth_type: z.enum(["local", "google", "github"]).optional(),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  email: z.string().trim().email("Invalid email").max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  organization_id: z.string().trim().optional(),
  role_id: z.string().trim().optional(),
  dob: z.string().optional(),
  fcm_token: z.string().trim().optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(["active", "inactive", "blocked"]),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().max(20).optional(),
  dob: z.string().optional(),
  fcm_token: z.string().trim().optional(),
});

export const userPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128),
});

export const requestOtpSchema = z.object({
  email: z.string().trim().email("Invalid email").max(100),
});

export const verifyOtpSchema = z.object({
  email: z.string().trim().email("Invalid email").max(100),
  otp: z.string().length(6, "OTP must be 6 digits"),
});

export const resetPasswordWithOtpSchema = z.object({
  email: z.string().trim().email("Invalid email").max(100),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(8, "Password must be at least 8 characters").max(128),
});
