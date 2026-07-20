import { z } from "zod";

export const updateNotificationPreferenceSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  in_app_notifications: z.boolean().optional(),
  preferences: z.object({
    document_verified: z.boolean().optional(),
    ticket_assigned: z.boolean().optional(),
    ticket_resolved: z.boolean().optional(),
    message_received: z.boolean().optional(),
    system_updates: z.boolean().optional(),
  }).optional(),
});
