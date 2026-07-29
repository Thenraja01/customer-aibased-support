import mongoose, { Schema } from "mongoose";

const branchSchema = new mongoose.Schema(
  {
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, maxlength: 100, trim: true },
    code: { type: String, maxlength: 50, trim: true, uppercase: true },
    address: { type: String, maxlength: 255 },
    phone: { type: String, maxlength: 20 },
    email: { type: String, maxlength: 255, lowercase: true },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    description: { type: String, maxlength: 500 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

branchSchema.index({ organization_id: 1, name: 1 }, { unique: true });

export default mongoose.model("Branch", branchSchema);
