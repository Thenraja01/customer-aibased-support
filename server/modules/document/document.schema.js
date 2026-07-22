import mongoose, { Schema } from "mongoose";

const documentSchema = new mongoose.Schema(
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
      required: true,
      index: true,
    },
    document_type_id: {
      type: Schema.Types.ObjectId,
      ref: "DocumentType",
    },
    title: { type: String, required: true, maxlength: 255 },
    file_id: { type: Schema.Types.ObjectId, required: true },
    file_name: { type: String, required: true },
    file_mimetype: { type: String, required: true },
    file_size: { type: Number, default: 0 },
    assigned_role: {
      type: String,
      default: "All",
    },
    status: {
      type: String,
      enum: ["draft", "pending", "approved", "rejected"],
      default: "draft",
    },
    approved_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    approved_at: { type: Date },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Document", documentSchema);
