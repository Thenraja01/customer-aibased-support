import Topic from "./topic.schema.js";
import Document from "../document/document.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import { processDocument } from "../document/document.service.js";
import mongoose from "mongoose";

export const getTopics = async (organizationId, filters = {}) => {
  const query = { organization_id: organizationId };
  if (filters.search) {
    query.name = new RegExp(filters.search, "i");
  }
  if (typeof filters.enabled === "boolean") {
    query.enabled = filters.enabled;
  }
  return await Topic.find(query).sort({ name: 1 }).lean();
};

export const findOrCreateTopic = async (name, description, organizationId) => {
  const cleanName = name.trim();
  let topic = await Topic.findOne({
    organization_id: organizationId,
    name: { $regex: new RegExp(`^${cleanName}$`, "i") }
  });

  if (!topic) {
    // Singular/plural fallback (e.g. Refund vs Refunds)
    const singularName = cleanName.endsWith('s') ? cleanName.slice(0, -1) : cleanName;
    const pluralName = cleanName + 's';
    topic = await Topic.findOne({
      organization_id: organizationId,
      name: { $regex: new RegExp(`^(${cleanName}|${singularName}|${pluralName})$`, "i") }
    });
  }

  if (!topic) {
    topic = await Topic.create({
      name: cleanName,
      description: description || `Topic relating to ${cleanName}`,
      organization_id: organizationId,
      enabled: true
    });
  }
  return topic;
};

export const createTopic = async (organizationId, data) => {
  const cleanName = data.name.trim();
  const existing = await Topic.findOne({
    organization_id: organizationId,
    name: { $regex: new RegExp(`^${cleanName}$`, "i") }
  });
  if (existing) {
    throw new Error(`Topic with name "${cleanName}" already exists.`);
  }

  return await Topic.create({
    ...data,
    organization_id: organizationId
  });
};

export const updateTopic = async (topicId, organizationId, updates) => {
  const topic = await Topic.findOne({ _id: topicId, organization_id: organizationId });
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

export const deleteTopic = async (topicId, organizationId) => {
  const topic = await Topic.findOne({ _id: topicId, organization_id: organizationId });
  if (!topic) {
    throw new Error("Topic not found.");
  }

  // Remove association from documents
  await Document.updateMany(
    { organization_id: organizationId, topics: topicId },
    { $pull: { topics: topicId } }
  );

  // Remove association from chunks
  await DocumentChunk.updateMany(
    { organization_id: organizationId, topics: topicId },
    { $pull: { topics: topicId } }
  );

  // Delete topic
  await Topic.deleteOne({ _id: topicId });

  // Delete from MongoDB Graph
  try {
    const mongoose = (await import("mongoose")).default;
    const GraphNode = mongoose.model("GraphNode");
    const GraphRelationship = mongoose.model("GraphRelationship");

    const t = await Topic.findOne({ _id: topicId });
    if (t) {
      await GraphNode.deleteMany({ type: "topic", ref_id: topicId });
      await GraphRelationship.deleteMany({
        $or: [
          { source_name: t.name },
          { target_name: t.name }
        ]
      });
    }
  } catch (err) {
    console.error("[MongoDB Graph] Failed to delete Topic node:", err.message);
  }

  return { success: true, message: "Topic deleted successfully." };
};

export const getTopicDocuments = async (topicId, organizationId) => {
  return await Document.find({
    organization_id: organizationId,
    topics: topicId
  })
    .select("_id title file_name file_size status visibility branch_id created_at")
    .lean();
};

export const getTopicChunks = async (topicId, organizationId) => {
  return await DocumentChunk.find({
    organization_id: organizationId,
    topics: topicId
  })
    .select("_id document_id chunk_index content token_count")
    .populate("document_id", "title")
    .lean();
};

export const getTopicGraph = async (topicId, organizationId) => {
  const topic = await Topic.findOne({ _id: topicId, organization_id: organizationId });
  if (!topic) {
    throw new Error("Topic not found.");
  }

  try {
    const mongoose = (await import("mongoose")).default;
    const GraphNode = mongoose.model("GraphNode");
    const GraphRelationship = mongoose.model("GraphRelationship");

    const topicRelations = await GraphRelationship.find({
      organization_id: organizationId,
      target_name: topic.name,
      target_type: "topic",
      type: "HAS_TOPIC"
    }).lean();

    const chunkNames = topicRelations
      .filter(r => r.source_type === "chunk")
      .map(r => r.source_name);

    const entityRelations = await GraphRelationship.find({
      organization_id: organizationId,
      source_name: { $in: chunkNames },
      source_type: "chunk",
      type: "HAS_ENTITY"
    }).lean();

    const entityNames = entityRelations.map(r => r.target_name);

    const rels = await GraphRelationship.find({
      organization_id: organizationId,
      source_name: { $in: entityNames },
      source_type: "entity",
      target_name: { $in: entityNames },
      target_type: "entity"
    }).lean();

    const entityNodes = await GraphNode.find({
      organization_id: organizationId,
      type: "entity",
      name: { $in: entityNames }
    }).lean();

    const entities = entityNodes.map(node => ({
      name: node.name,
      type: node.properties?.entity_type || "Entity"
    }));

    const relationships = rels.map(r => ({
      source: r.source_name,
      target: r.target_name,
      type: r.type
    }));

    return {
      entities,
      relationships
    };
  } catch (err) {
    console.error("[MongoDB Graph] getTopicGraph failed:", err.message);
    return { entities: [], relationships: [] };
  }
};

export const reindexTopicDocuments = async (topicId, organizationId) => {
  const docs = await Document.find({
    organization_id: organizationId,
    topics: topicId
  });

  for (const doc of docs) {
    if (doc.currentVersionId) {
      // Trigger document re-processing
      await processDocument(doc._id, doc.currentVersionId);
    }
  }

  return { success: true, count: docs.length };
};
