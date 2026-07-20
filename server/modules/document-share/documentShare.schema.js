import mongoose, { Schema } from "mongoose";

const documentShareSchema = new mongoose.Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    shared_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shared_with: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    permission: {
      type: String,
      enum: ["view", "edit", "download"],
      default: "view",
    },
    expires_at: { type: Date, index: true },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export default mongoose.model("DocumentShare", documentShareSchema);
