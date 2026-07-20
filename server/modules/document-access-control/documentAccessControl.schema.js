import mongoose, { Schema } from "mongoose";

const documentAccessControlSchema = new mongoose.Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    role_id: {
      type: Schema.Types.ObjectId,
      ref: "Role",
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    permission: {
      type: String,
      enum: ["view", "edit", "delete", "verify"],
      required: true,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
  }
);

export default mongoose.model(
  "DocumentAccessControl",
  documentAccessControlSchema
);
