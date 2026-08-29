import KnowledgeNode from "./knowledgeNode.schema.js";
import { getCachedEmbedding } from "../../services/embeddingCache.service.js";
import { cosineSimilarity } from "../rag/rag.service.js";
import mongoose from "mongoose";

/**
 * Build tenant scope filter for multi-tenant isolation
 */
const buildTenantScope = (orgId, branchId = null) => {
  const filter = { orgId: new mongoose.Types.ObjectId(orgId) };
  if (branchId) {
    filter.branchId = new mongoose.Types.ObjectId(branchId);
  }
  return filter;
};

/**
 * Retrieve a Knowledge Node with incoming and outgoing relations
 */
export const getKnowledgeNodeWithNeighborhood = async (nodeId, orgId, branchId = null) => {
  const filter = {
    _id: new mongoose.Types.ObjectId(nodeId),
    orgId: new mongoose.Types.ObjectId(orgId),
  };
  if (branchId) filter.branchId = new mongoose.Types.ObjectId(branchId);

  const node = await KnowledgeNode.findOne(filter)
    .populate("relatedNodes.targetNodeId", "title category nodeType status")
    .lean();

  if (!node) return null;

  // Retrieve incoming references
  const incomingNodes = await KnowledgeNode.find({
    orgId: new mongoose.Types.ObjectId(orgId),
    "relatedNodes.targetNodeId": node._id,
  })
    .select("title category nodeType relatedNodes")
    .lean();

  return {
    ...node,
    incomingConnectedNodes: incomingNodes || [],
  };
};
export const getNodeNeighborhood = async (nodeId, orgId, branchId = null, depth = 2) => {
  return getKnowledgeNodeWithNeighborhood(nodeId, orgId, branchId);
};

export const getPrerequisiteTree = async (nodeId, orgId, branchId = null, depth = 3) => {
  const filter = buildTenantScope(orgId, branchId);
  filter._id = new mongoose.Types.ObjectId(nodeId);

  const results = await KnowledgeNode.aggregate([
    { $match: filter },
    {
      $graphLookup: {
        from: "knowledgenodes",
        startWith: "$relatedNodes.targetNodeId",
        connectFromField: "relatedNodes.targetNodeId",
        connectToField: "_id",
        as: "prerequisites",
        maxDepth: depth - 1,
        depthField: "depth",
        restrictSearchWithMatch: {
          ...buildTenantScope(orgId, branchId),
        },
      },
    },
  ]);

  return results[0] || null;
};
export const getPolicyResolutionGraph = async (category = "Policy", orgId, branchId = null, depth = 3) => {
  const filter = buildTenantScope(orgId, branchId);
  filter.category = category;

  const results = await KnowledgeNode.aggregate([
    { $match: filter },
    {
      $graphLookup: {
        from: "knowledgenodes",
        startWith: "$relatedNodes.targetNodeId",
        connectFromField: "relatedNodes.targetNodeId",
        connectToField: "_id",
        as: "policyTree",
        maxDepth: depth - 1,
        depthField: "depth",
        restrictSearchWithMatch: {
          ...buildTenantScope(orgId, branchId),
        },
      },
    },
  ]);

  return results;
};

/**
 * Create Knowledge Node with Native MongoDB Storage
 */
export const createKnowledgeNodeTransactional = async (nodeData, orgId, branchId = null) => {
  const textToEmbed = `${nodeData.title}\n${nodeData.content}\n${(nodeData.tags || []).join(", ")}`;
  const embedding = await getCachedEmbedding(textToEmbed);

  const docPayload = {
    ...nodeData,
    orgId: new mongoose.Types.ObjectId(orgId),
    branchId: branchId ? new mongoose.Types.ObjectId(branchId) : null,
    embedding: embedding || [],
  };

  const node = await KnowledgeNode.create(docPayload);
  return node;
};

/**
 * Update Knowledge Node with Native MongoDB
 */
export const updateKnowledgeNodeTransactional = async (nodeId, updateData, orgId, branchId = null) => {
  const filter = {
    _id: new mongoose.Types.ObjectId(nodeId),
    orgId: new mongoose.Types.ObjectId(orgId),
  };
  if (branchId) filter.branchId = new mongoose.Types.ObjectId(branchId);

  const existingNode = await KnowledgeNode.findOne(filter);
  if (!existingNode) {
    throw new Error("Knowledge node not found or tenant access denied");
  }

  const shouldReEmbed = updateData.title || updateData.content || updateData.tags;
  if (shouldReEmbed) {
    const textToEmbed = `${updateData.title || existingNode.title}\n${
      updateData.content || existingNode.content
    }\n${(updateData.tags || existingNode.tags || []).join(", ")}`;
    const embedding = await getCachedEmbedding(textToEmbed);
    if (embedding) {
      updateData.embedding = embedding;
    }
  }

  const updatedNode = await KnowledgeNode.findOneAndUpdate(filter, { $set: updateData }, { new: true });
  return updatedNode;
};

/**
 * Delete Knowledge Node with Native MongoDB
 */
export const deleteKnowledgeNodeTransactional = async (nodeId, orgId, branchId = null) => {
  const filter = {
    _id: new mongoose.Types.ObjectId(nodeId),
    orgId: new mongoose.Types.ObjectId(orgId),
  };
  if (branchId) filter.branchId = new mongoose.Types.ObjectId(branchId);

  const node = await KnowledgeNode.findOneAndDelete(filter);
  if (!node) {
    throw new Error("Knowledge node not found or tenant access denied");
  }

  // Remove incoming edges referencing this deleted node within the tenant
  await KnowledgeNode.updateMany(
    { orgId: new mongoose.Types.ObjectId(orgId), "relatedNodes.targetNodeId": new mongoose.Types.ObjectId(nodeId) },
    { $pull: { relatedNodes: { targetNodeId: new mongoose.Types.ObjectId(nodeId) } } }
  );

  return { success: true, deletedId: nodeId };
};

/**
 * Hybrid Vector + Native MongoDB $graphLookup Retrieval Pipeline
 */
export const retrieveHybridKnowledgeGraph = async (
  queryText,
  orgId,
  branchId = null,
  limit = 5,
  graphExpansionDepth = 2
) => {
  const startTime = Date.now();
  const queryEmbedding = await getCachedEmbedding(queryText);

  const filter = buildTenantScope(orgId, branchId);
  filter.status = "published";

  let matchedNodeIds = [];

  if (queryEmbedding && Array.isArray(queryEmbedding)) {
    const candidateNodes = await KnowledgeNode.find({ ...filter, embedding: { $exists: true, $ne: [] } })
      .select("_id embedding title")
      .lean();

    if (candidateNodes.length > 0) {
      const scored = candidateNodes
        .map((n) => ({
          id: n._id.toString(),
          score: cosineSimilarity(queryEmbedding, n.embedding),
        }))
        .filter((n) => !isNaN(n.score) && n.score >= 0.4)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      matchedNodeIds = scored.map((s) => s.id);
    }
  }

  // Fallback to text search if no vector matches
  if (matchedNodeIds.length === 0) {
    const textMatches = await KnowledgeNode.find(
      { $text: { $search: queryText }, ...buildTenantScope(orgId, branchId) },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(limit)
      .select("_id")
      .lean();
    matchedNodeIds = textMatches.map((m) => m._id.toString());
  }

  if (matchedNodeIds.length === 0) {
    return { seedNodes: [], expandedGraph: [], latencyMs: Date.now() - startTime };
  }

  const objectIds = matchedNodeIds.map((id) => new mongoose.Types.ObjectId(id));

  // 2. Graph Lookup Phase ($graphLookup)
  const expansionPipeline = [
    {
      $match: {
        _id: { $in: objectIds },
        ...buildTenantScope(orgId, branchId),
      },
    },
    {
      $graphLookup: {
        from: "knowledgenodes",
        startWith: "$relatedNodes.targetNodeId",
        connectFromField: "relatedNodes.targetNodeId",
        connectToField: "_id",
        as: "connectedNeighborhood",
        maxDepth: graphExpansionDepth - 1,
        depthField: "distance",
        restrictSearchWithMatch: {
          ...buildTenantScope(orgId, branchId),
          status: "published",
        },
      },
    },
    {
      $project: {
        _id: 1,
        title: 1,
        content: 1,
        category: 1,
        nodeType: 1,
        tags: 1,
        relatedNodes: 1,
        connectedNeighborhood: {
          $map: {
            input: "$connectedNeighborhood",
            as: "neighbor",
            in: {
              _id: "$$neighbor._id",
              title: "$$neighbor.title",
              category: "$$neighbor.category",
              nodeType: "$$neighbor.nodeType",
              distance: "$$neighbor.distance",
              relationType: "$$neighbor.relatedNodes.relationType",
            },
          },
        },
      },
    },
  ];

  const results = await KnowledgeNode.aggregate(expansionPipeline);

  return {
    seedNodes: results.map((r) => ({
      _id: r._id,
      title: r.title,
      content: r.content,
      category: r.category,
      nodeType: r.nodeType,
      tags: r.tags,
    })),
    expandedGraph: results.flatMap((r) => r.connectedNeighborhood || []),
    latencyMs: Date.now() - startTime,
  };
};
