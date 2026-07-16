import mongoose from "mongoose";

const OrganizationSchema = new mongoose.Schema(
  {
    organization_id: {
      type: String,
      unique: true,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
    },
    phone: {
      type: String,
      maxlength: 20,
    },
    email: {
      type: String,
      maxlength: 255,
      unique: true,
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("Organization", OrganizationSchema);
