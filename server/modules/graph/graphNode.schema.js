import mongoose, { Schema } from "mongoose";

const graphNodeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    type: {
      type: String,
      enum: [
        "entity",
        "topic",
        "document",
        "chunk",
        "customer",
        "ticket",
        "error",
        "transaction",
        "product",
        "service",
        "policy",
        "incident",
        "resolution",
      ],
      required: true,
      index: true,
    },
    canonical_id: {
      type: String,
      default: null,
      index: true,
    },
    entity_resolution_hash: {
      type: String,
      default: null,
      index: true,
    },
    ref_id: {
      type: Schema.Types.ObjectId,
      default: null,
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
    properties: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  }
);

// Optimize node indexing per organization
graphNodeSchema.index({ organization_id: 1, type: 1, name: 1 });
graphNodeSchema.index({ organization_id: 1, canonical_id: 1 }, { sparse: true });

export default mongoose.model("GraphNode", graphNodeSchema);
