import mongoose, { Schema } from "mongoose";

const auditLogSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
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
    ip_address: { type: String, maxlength: 45, default: null },
    user_agent: { type: String, maxlength: 500, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

auditLogSchema.index({ created_at: 1 });
auditLogSchema.index({ organization_id: 1, created_at: -1 });
auditLogSchema.index({ organization_id: 1, branch_id: 1, created_at: -1 });

export default mongoose.model("AuditLog", auditLogSchema);
