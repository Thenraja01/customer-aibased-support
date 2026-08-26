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
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    scope: {
      type: String,
      enum: ["org_broadcast", "branch_channel", "direct"],
      default: "org_broadcast",
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

communicationSchema.index({ organization_id: 1, branch_id: 1, created_at: -1 });
communicationSchema.index({ sender_id: 1, receiver_id: 1, created_at: -1 });

export default mongoose.model("Communication", communicationSchema);
