import KnowledgeGraph from "./knowledgeGraph.schema.js";
import GraphEdge from "./graphEdge.schema.js";
import { sha256 } from "../../utils/hash.utils.js";
import { escapeRegex } from "../../utils/escapeRegex.js";

export const upsertNode = async (data) => {
  const hash = sha256(JSON.stringify(data));
  const existing = await KnowledgeGraph.findOne({
    document_id: data.document_id,
    entity_name: data.entity_name,
  });
  if (existing) {
    existing.content_hash = hash;
    existing.metadata = data.metadata || existing.metadata;
    await existing.save();
    return existing;
  }
  return await KnowledgeGraph.create({ ...data, content_hash: hash });
};

export const findNodeById = async (id) => {
  return await KnowledgeGraph.findById(id);
};

export const findNodesByDocument = async (documentId) => {
  return await KnowledgeGraph.find({ document_id: documentId });
};

export const findNodesByEntityName = async (name) => {
  const safe = escapeRegex(name);
  return await KnowledgeGraph.find({
    entity_name: { $regex: safe, $options: "i" },
  });
};

export const deleteNodesByDocument = async (documentId) => {
  await KnowledgeGraph.deleteMany({ document_id: documentId });
};

export const upsertEdge = async (data) => {
  const existing = await GraphEdge.findOne({
    source_id: data.source_id,
    target_id: data.target_id,
    relationship: data.relationship,
  });
  if (existing) {
    existing.weight = data.weight || existing.weight;
    await existing.save();
    return existing;
  }
  return await GraphEdge.create(data);
};

export const getEdgesByNode = async (nodeId) => {
  return await GraphEdge.find({
    $or: [{ source_id: nodeId }, { target_id: nodeId }],
  });
};

export const deleteEdgesByDocument = async (documentId) => {
  await GraphEdge.deleteMany({ document_id: documentId });
};

export const bfsTraversal = async (startNodeId, maxDepth = 2) => {
  const visited = new Set();
  const queue = [{ nodeId: startNodeId, depth: 0 }];
  const result = [];

  while (queue.length > 0) {
    const { nodeId, depth } = queue.shift();
    if (visited.has(nodeId.toString()) || depth > maxDepth) continue;
    visited.add(nodeId.toString());

    const node = await KnowledgeGraph.findById(nodeId);
    if (node) result.push({ ...node.toObject(), depth });

    const edges = await getEdgesByNode(nodeId);
    for (const edge of edges) {
      const nextId = edge.source_id.toString() === nodeId.toString()
        ? edge.target_id
        : edge.source_id;
      if (!visited.has(nextId.toString())) {
        queue.push({ nodeId: nextId, depth: depth + 1 });
      }
    }
  }
  return result;
};

export const findSeedNodes = async (documentId, limit = 5) => {
  return await KnowledgeGraph.find({ document_id: documentId })
    .limit(limit)
    .lean();
};

export const getGraphStats = async (documentId) => {
  const query = documentId ? { document_id: documentId } : {};
  const [nodeCount, edgeCount] = await Promise.all([
    KnowledgeGraph.countDocuments(query),
    GraphEdge.countDocuments(documentId ? { document_id: documentId } : {}),
  ]);
  return { nodeCount, edgeCount };
};
