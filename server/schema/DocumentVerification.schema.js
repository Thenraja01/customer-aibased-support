import mongoose, { Schema } from "mongoose";

const documentVerificationSchema = new Schema(
  {
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    verified_by: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
      required: true,
    },
    remarks: {
      type: String,
      maxlength: 1000,
    },
    verified_at: {
      type: Date,
    },
  },
  {
    timestamps: false,
  }
);

export default mongoose.model("DocumentVerification", documentVerificationSchema);
