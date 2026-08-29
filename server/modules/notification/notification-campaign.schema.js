import mongoose from "mongoose";

const notificationCampaignSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    audience_type: {
      type: String,
      enum: ["all", "branch", "role", "branch_role"],
      required: true,
      default: "all",
    },
    branch_ids: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Branch",
      },
    ],
    role_ids: [
      {
        type: String,
      },
    ],
    type: {
      type: String,
      enum: ["info", "success", "warning", "error"],
      required: true,
      default: "info",
    },
    title: {
      type: String,
      required: true,
      maxlength: 255,
    },
    message: {
      type: String,
      required: true,
    },
    delivery_methods: [
      {
        type: String,
        enum: ["in_app", "email", "push", "sms", "system"],
      },
    ],
    cta_text: {
      type: String,
      default: "",
    },
    cta_url: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["sent", "failed", "pending"],
      default: "sent",
    },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

export default mongoose.model("NotificationCampaign", notificationCampaignSchema);
