import mongoose, { Schema } from "mongoose";

const notificationPreferenceSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    email_notifications: { type: Boolean, default: true },
    push_notifications: { type: Boolean, default: true },
    in_app_notifications: { type: Boolean, default: true },
    preferences: {
      document_verified: { type: Boolean, default: true },
      ticket_assigned: { type: Boolean, default: true },
      ticket_resolved: { type: Boolean, default: true },
      message_received: { type: Boolean, default: true },
      system_updates: { type: Boolean, default: true },
    },
  },
  {
    timestamps: { createdAt: false, updatedAt: "updated_at" },
  }
);

export default mongoose.model(
  "NotificationPreference",
  notificationPreferenceSchema
);
