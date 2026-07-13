import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      maxlength: 100,
    },
    table_name: {
      type: String,
      required: true,
      maxlength: 100,
    },
    record_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

export default mongoose.model("AuditLog", auditLogSchema);
