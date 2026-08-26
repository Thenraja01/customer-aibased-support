import mongoose, { Schema } from "mongoose";

/**
 * Directed relational edge embedded subdocument schema
 */
const relationalEdgeSchema = new Schema(
  {
    targetNodeId: {
      type: Schema.Types.ObjectId,
      ref: "KnowledgeNode",
      required: [true, "targetNodeId is required for relational edge"],
      index: true,
    },
    relationType: {
      type: String,
      required: [true, "relationType is required (e.g., REQUIRES_PREREQUISITE, GOVERNS, RESOLVES, RELATED_TO)"],
      trim: true,
      uppercase: true,
      index: true,
    },
    weight: {
      type: Number,
      default: 1.0,
      min: 0.0,
      max: 1.0,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { _id: false }
);

/**
 * KnowledgeNode Schema
 * Replaces Neo4j 5 Graph Nodes & Edges natively in MongoDB 7+ / Mongoose 9
 */
const knowledgeNodeSchema = new Schema(
  {
    orgId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: [true, "orgId (Organization ID) is strictly required for multi-tenant isolation"],
      index: true,
    },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      index: true,
    },
    title: {
      type: String,
      required: [true, "KnowledgeNode title is required"],
      trim: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: [true, "KnowledgeNode content body is required"],
    },
    tags: {
      type: [String],
      default: [],
      index: true,
    },
    category: {
      type: String,
      required: [true, "KnowledgeNode category is required (e.g. Troubleshooting, Policy, Hardware, Billing)"],
      trim: true,
      index: true,
    },
    nodeType: {
      type: String,
      enum: [
        "article",
        "topic",
        "policy",
        "troubleshooting_step",
        "prerequisite",
        "error_code",
        "product",
        "service",
        "incident",
        "resolution",
      ],
      default: "article",
      index: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "published",
      index: true,
    },
    // Directed graph adjacency list replacing Neo4j Relationships
    relatedNodes: {
      type: [relationalEdgeSchema],
      default: [],
    },
    // In-document vector embedding cache (synced with ChromaDB)
    embedding: {
      type: [Number],
      default: undefined,
      select: false, // Omit from default projection to minimize wire payload & JVM/memory footprint
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Compound Indexes for Sub-30ms Multi-Tenant Queries & Traversals ───

// 1. Primary multi-tenant category lookup index
knowledgeNodeSchema.index({ orgId: 1, branchId: 1, category: 1 });

// 2. High-performance reverse edge and recursive $graphLookup index
knowledgeNodeSchema.index({ orgId: 1, branchId: 1, "relatedNodes.targetNodeId": 1 });

// 3. Multi-tenant relation-type filtering index
knowledgeNodeSchema.index({ orgId: 1, branchId: 1, "relatedNodes.relationType": 1 });

// 4. Multi-tenant tag search index
knowledgeNodeSchema.index({ orgId: 1, branchId: 1, tags: 1 });

// 5. Multi-tenant status & creation ordering index
knowledgeNodeSchema.index({ orgId: 1, branchId: 1, status: 1, createdAt: -1 });

// 6. Full-text search index for keyword and content retrieval
knowledgeNodeSchema.index(
  { title: "text", content: "text", tags: "text" },
  { weights: { title: 10, tags: 5, content: 1 }, name: "KnowledgeNodeTextIndex" }
);

export const KnowledgeNode = mongoose.model("KnowledgeNode", knowledgeNodeSchema);
export default KnowledgeNode;
