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
      index: true,
    },
    record_id: {
      type: String,
      required: true,
    },
    old_value: { type: Schema.Types.Mixed },
    new_value: { type: Schema.Types.Mixed },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

auditLogSchema.index({ created_at: 1 });

export default mongoose.model("AuditLog", auditLogSchema);
