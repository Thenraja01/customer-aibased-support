import mongoose, { Schema } from "mongoose";

const documentSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    document_type_id: {
      type: Schema.Types.ObjectId,
      ref: "DocumentType",
      required: true,
    },

    file_name: {
      type: String,
      required: true,
      maxlength: 255,
    },

    file_path: {
      type: String,
      required: true,
      maxlength: 500,
    },

    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },


    uploaded_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "uploaded_at",
      updatedAt: false,
    },
  }
);

documentSchema.index({ user_id: 1 });

export default mongoose.model("Document", documentSchema);