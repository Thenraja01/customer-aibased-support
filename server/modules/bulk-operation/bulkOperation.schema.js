import mongoose, { Schema } from "mongoose";

const bulkOperationSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    operation_type: {
      type: String,
      enum: ["upload", "delete", "update", "verify"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
    },
    total_records: { type: Number, default: 0 },
    processed_records: { type: Number, default: 0 },
    failed_records: { type: Number, default: 0 },
    error_log: { type: [Object], default: [] },
    completed_at: { type: Date },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export default mongoose.model("BulkOperation", bulkOperationSchema);
