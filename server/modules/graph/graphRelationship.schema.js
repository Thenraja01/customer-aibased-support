import mongoose, { Schema } from "mongoose";

const graphRelationshipSchema = new mongoose.Schema(
  {
    source_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    source_type: {
      type: String,
      required: true,
      index: true,
    },
    target_name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    target_type: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      required: true,
      trim: true,
      index: true, // e.g. "RELATED_TO", "HAS_TOPIC", "HAS_CHUNK", "HAS_ENTITY"
    },
    document_id: {
      type: Schema.Types.ObjectId,
      ref: "Document",
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
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: false,
    },
  }
);

// Optimize relationship lookups
graphRelationshipSchema.index({ organization_id: 1, source_name: 1, target_name: 1 });

export default mongoose.model("GraphRelationship", graphRelationshipSchema);
