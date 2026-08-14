import mongoose, { Schema } from "mongoose";

const graphEntitySchema = new mongoose.Schema(
  {
    entity_name: {
      type: String,
      required: true,
      index: true,
    },
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
      required: true,
      index: true,
    },
    organization_id: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    branch_id: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Compound indexes for optimized querying
graphEntitySchema.index({ organization_id: 1, entity_name: 1 });
graphEntitySchema.index({ document_id: 1, entity_name: 1 });

export default mongoose.model("GraphEntity", graphEntitySchema);
