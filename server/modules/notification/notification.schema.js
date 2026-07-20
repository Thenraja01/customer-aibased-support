import mongoose, { Schema } from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, maxlength: 255 },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["info", "warning", "success", "error"],
      default: "info",
    },
    link: { type: String, maxlength: 500 },
    is_read: { type: Boolean, default: false, index: true },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

notificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

export default mongoose.model("Notification", notificationSchema);
