import mongoose, { Schema } from "mongoose";

const communicationSchema = new mongoose.Schema(
  {
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      index: true,
    },
    message: { type: String, required: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["sent", "seen"],
      default: "sent",
      index: true,
    },
    seen_at: { type: Date },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Communication", communicationSchema);
