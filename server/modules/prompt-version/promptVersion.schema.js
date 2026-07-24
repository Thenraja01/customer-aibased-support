import mongoose from "mongoose";

const promptVersionSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    version: { type: Number, required: true },
    system_prompt: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    published_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    published_at: { type: Date },
    created_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

promptVersionSchema.index({ organization_id: 1, version: -1 });

export default mongoose.model("PromptVersion", promptVersionSchema);
