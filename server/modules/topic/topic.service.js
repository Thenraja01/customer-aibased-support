import Topic from "./topic.schema.js";
import Document from "../document/document.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import { processDocument } from "../document/document.service.js";
import mongoose from "mongoose";

export const getTopics = async (organizationId, branchId, filters = {}) => {
  const query = { organization_id: organizationId };
  if (branchId) query.branch_id = branchId;
  if (filters.search) {
    query.name = new RegExp(filters.search, "i");
  }
  if (typeof filters.enabled === "boolean") {
    query.enabled = filters.enabled;
  }
  return await Topic.find(query).sort({ name: 1 }).lean();
};

export const findOrCreateTopic = async (name, description, organizationId, branchId = null) => {
  const cleanName = name.trim();
  let query = {
    organization_id: organizationId,
    name: { $regex: new RegExp(`^${cleanName}$`, "i") }
  };
  if (branchId) query.branch_id = branchId;

  let topic = await Topic.findOne(query);

  if (!topic) {
    // Singular/plural fallback (e.g. Refund vs Refunds)
    const singularName = cleanName.endsWith('s') ? cleanName.slice(0, -1) : cleanName;
    const pluralName = cleanName + 's';
    let queryFallback = {
      organization_id: organizationId,
      name: { $regex: new RegExp(`^(${cleanName}|${singularName}|${pluralName})$`, "i") }
    };
    if (branchId) queryFallback.branch_id = branchId;
    topic = await Topic.findOne(queryFallback);
  }

  if (!topic) {
    topic = await Topic.create({
      name: cleanName,
      description: description || `Topic relating to ${cleanName}`,
      organization_id: organizationId,
      branch_id: branchId,
      enabled: true
    });
  }
  return topic;
};

export const createTopic = async (organizationId, branchId, data) => {
  const cleanName = data.name.trim();
  let query = {
    organization_id: organizationId,
    name: { $regex: new RegExp(`^${cleanName}$`, "i") }
  };
  if (branchId) query.branch_id = branchId;

  const existing = await Topic.findOne(query);
  if (existing) {
    throw new Error(`Topic with name "${cleanName}" already exists.`);
  }

  return await Topic.create({
    ...data,
    organization_id: organizationId,
    branch_id: branchId
  });
};

export const updateTopic = async (topicId, organizationId, branchId, updates) => {
  let query = { _id: topicId, organization_id: organizationId };
  if (branchId) query.branch_id = branchId;
  const topic = await Topic.findOne(query);
  if (!topic) {
    throw new Error("Topic not found.");
  }

  const allowedUpdates = ["name", "description", "enabled", "tools"];
  allowedUpdates.forEach((key) => {
    if (updates[key] !== undefined) {
      topic[key] = updates[key];
    }
  });

  await topic.save();
  return topic;
};

export const deleteTopic = async (topicId, organizationId, branchId) => {
  let query = { _id: topicId, organization_id: organizationId };
  if (branchId) query.branch_id = branchId;
  const topic = await Topic.findOne(query);
  if (!topic) {
    throw new Error("Topic not found.");
  }

  let docQuery = { organization_id: organizationId, topics: topicId };
  if (branchId) docQuery.branch_id = branchId;

  // Remove association from documents
  await Document.updateMany(
    docQuery,
    { $pull: { topics: topicId } }
  );

  // Remove association from chunks
  await DocumentChunk.updateMany(
    docQuery,
    { $pull: { topics: topicId } }
  );

  // Delete topic
  await Topic.deleteOne(query);

  // Delete from MongoDB Graph
  try {
    const mongoose = (await import("mongoose")).default;
    const GraphNode = mongoose.model("GraphNode");
    const GraphRelationship = mongoose.model("GraphRelationship");

    if (topic) {
      let nodeQuery = { type: "topic", ref_id: topicId, organization_id: organizationId };
      if (branchId) nodeQuery.branch_id = branchId;
      await GraphNode.deleteMany(nodeQuery);
      
      let relQuery = {
        organization_id: organizationId,
        $or: [
          { source_name: topic.name },
          { target_name: topic.name }
        ]
      };
      if (branchId) relQuery.branch_id = branchId;
      await GraphRelationship.deleteMany(relQuery);
    }
  } catch (err) {
    console.error("[MongoDB Graph] Failed to delete Topic node:", err.message);
  }

  return { success: true, message: "Topic deleted successfully." };
};

export const getTopicDocuments = async (topicId, organizationId, branchId) => {
  let query = {
    organization_id: organizationId,
    topics: topicId
  };
  if (branchId) query.branch_id = branchId;
  return await Document.find(query)
    .select("_id title file_name file_size status visibility branch_id created_at")
    .lean();
};

export const getTopicChunks = async (topicId, organizationId, branchId) => {
  let query = {
    organization_id: organizationId,
    topics: topicId
  };
  if (branchId) query.branch_id = branchId;
  return await DocumentChunk.find(query)
    .select("_id document_id chunk_index content token_count")
    .populate("document_id", "title")
    .lean();
};

export const getTopicGraph = async (topicId, organizationId, branchId, options = {}) => {
  let query = { _id: topicId, organization_id: organizationId };
  if (branchId) query.branch_id = branchId;
  const topic = await Topic.findOne(query);
  if (!topic) {
    throw new Error("Topic not found.");
  }

  try {
    const mongoose = (await import("mongoose")).default;
    const GraphNode = mongoose.model("GraphNode");
    const GraphRelationship = mongoose.model("GraphRelationship");
    const Document = mongoose.model("Document");
    const DocumentChunk = mongoose.model("DocumentChunk");

    const { entityType, relationshipType, search, documentId, minConfidence = 0, limit = 500 } = options;

    let relQuery = {
      organization_id: organizationId,
      target_name: topic.name,
      target_type: "topic",
      type: "HAS_TOPIC"
    };
    if (branchId) relQuery.branch_id = branchId;
    const topicRelations = await GraphRelationship.find(relQuery).lean();

    const chunkNames = topicRelations
      .filter((r) => r.source_type === "chunk" || (r.source_name && r.source_name.startsWith("Chunk")) || r.chunk_id)
      .map((r) => r.source_name);

    let entityRelQuery = {
      organization_id: organizationId,
      source_name: { $in: chunkNames },
      type: "HAS_ENTITY"
    };
    if (branchId) entityRelQuery.branch_id = branchId;
    if (documentId) entityRelQuery.document_id = documentId;

    const entityRelations = await GraphRelationship.find(entityRelQuery).lean();
    const entityNames = [...new Set(entityRelations.map((r) => r.target_name))];

    let relsQuery = {
      organization_id: organizationId,
      source_name: { $in: entityNames },
      target_name: { $in: entityNames }
    };
    if (branchId) relsQuery.branch_id = branchId;
    if (relationshipType) relsQuery.type = relationshipType;
    if (documentId) relsQuery.document_id = documentId;

    let rels = await GraphRelationship.find(relsQuery).populate("document_id", "title file_name").limit(Number(limit)).lean();

    let nodeQuery = {
      organization_id: organizationId,
      name: { $in: entityNames }
    };
    if (branchId) nodeQuery.branch_id = branchId;
    if (entityType) nodeQuery["properties.entity_type"] = entityType;
    if (search) nodeQuery.name = { $regex: search, $options: "i" };

    const entityNodes = await GraphNode.find(nodeQuery).limit(Number(limit)).lean();

    // Map doc titles & chunk details for metadata
    const docIds = [...new Set(entityRelations.map(r => r.document_id?.toString()).filter(Boolean))];
    const docs = await Document.find({ _id: { $in: docIds } }).select("title file_name").lean();
    const docMap = new Map(docs.map(d => [d._id.toString(), d]));

    const nodes = entityNodes.map((node) => {
      const relatedRel = entityRelations.find(r => r.target_name === node.name);
      const doc = relatedRel?.document_id ? docMap.get(relatedRel.document_id.toString()) : null;

      return {
        id: node._id.toString(),
        name: node.name,
        label: node.name,
        type: node.properties?.entity_type || node.properties?.type || "RESOURCE",
        metadata: {
          entityId: node._id.toString(),
          type: node.properties?.entity_type || "RESOURCE",
          label: node.name,
          sourceDocumentId: doc?._id?.toString() || null,
          sourceDocumentTitle: doc?.title || doc?.file_name || "Knowledge Base Doc",
          sourceChunkId: relatedRel?.source_name || null,
          properties: node.properties || {}
        }
      };
    });

    const nodeNameSet = new Set(nodes.map(n => n.name));

    const edges = rels
      .filter(r => nodeNameSet.has(r.source_name) && nodeNameSet.has(r.target_name))
      .map((r, idx) => {
        const sourceNode = nodes.find(n => n.name === r.source_name);
        const targetNode = nodes.find(n => n.name === r.target_name);

        return {
          id: r._id?.toString() || `edge_${idx}`,
          source: sourceNode?.id || r.source_name,
          target: targetNode?.id || r.target_name,
          sourceName: r.source_name,
          targetName: r.target_name,
          relationship: r.type || "RELATED_TO",
          type: r.type || "RELATED_TO",
          confidence: r.confidence || 0.9,
          documentId: r.document_id?._id?.toString() || null,
          documentTitle: r.document_id?.title || r.document_id?.file_name || null
        };
      });

    const entities = nodes.map(node => ({
      name: node.name,
      type: node.type
    }));

    const relationships = edges.map(r => ({
      source: r.sourceName,
      target: r.targetName,
      type: r.relationship
    }));

    return {
      topic: {
        id: topic._id.toString(),
        name: topic.name,
        description: topic.description
      },
      nodes,
      edges,
      entities,
      relationships
    };
  } catch (err) {
    console.error("[MongoDB Graph] getTopicGraph failed:", err.message);
    return {
      topic: { id: topicId, name: "Topic" },
      nodes: [],
      edges: [],
      entities: [],
      relationships: []
    };
  }
};

export const reindexTopicDocuments = async (topicId, organizationId, branchId) => {
  let query = {
    organization_id: organizationId,
    topics: topicId
  };
  if (branchId) query.branch_id = branchId;
  const docs = await Document.find(query);

  for (const doc of docs) {
    if (doc.currentVersionId) {
      // Trigger document re-processing
      await processDocument(doc._id, doc.currentVersionId);
    }
  }

  return { success: true, count: docs.length };
};
