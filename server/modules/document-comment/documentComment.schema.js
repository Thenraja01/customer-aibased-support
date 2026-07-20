import mongoose, { Schema } from "mongoose";

const documentCommentSchema = new mongoose.Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    comment: { type: String, required: true, maxlength: 1000 },
    parent_id: {
      type: Schema.Types.ObjectId,
      ref: "DocumentComment",
    },
    is_resolved: { type: Boolean, default: false },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("DocumentComment", documentCommentSchema);
