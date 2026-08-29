import mongoose from "mongoose";
import GraphNode from "./graphNode.schema.js";
import GraphRelationship from "./graphRelationship.schema.js";
import Topic from "../topic/topic.schema.js";
import Document from "../document/document.schema.js";
import DocumentChunk from "../document/documentChunk.schema.js";
import KnowledgeGap from "../knowledge-gap/knowledgeGap.schema.js";
import { processDocument } from "../document/document.service.js";

/**
 * Resolve organization ID from request based on user scope
 */
const getOrgId = (req) => {
  if (req.scope?.isSuperAdmin) {
    return req.query.organizationId || req.params.organizationId || req.user?.organizationId || null;
  }
  return req.scope?.organizationId || req.user?.organizationId || null;
};

/**
 * Resolve branch ID from request based on user scope
 */
const getBranchId = (req) => {
  if (req.scope?.isSuperAdmin || req.scope?.isOrgAdmin) {
    return req.query.branchId || req.params.branchId || null;
  }
  return req.scope?.branchId || req.user?.branchId || null;
};

/**
 * GET /knowledge-graph/stats
 */
export const getGraphStats = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(200).json({
        success: true,
        data: {
          entityCount: 0,
          newEntitiesThisWeek: 0,
          relationshipCount: 0,
          avgRelsPerEntity: "0.0",
          totalDocs: 0,
          indexedDocs: 0,
          totalTopics: 0,
          activeTopics: 0,
          lastIndexed: null,
          status: "No Organization Context"
        }
      });
    }

    const branchId = getBranchId(req);
    const query = { organization_id: new mongoose.Types.ObjectId(orgId) };
    if (branchId) {
      query.branch_id = new mongoose.Types.ObjectId(branchId);
    }

    // 1. Entities count (GraphNode of type "entity")
    const entityCount = await GraphNode.countDocuments({ ...query, type: "entity" });

    // 2. Relationships count
    const relationshipCount = await GraphRelationship.countDocuments(query);

    // 3. Documents count
    const totalDocs = await Document.countDocuments(query);
    const readyDocs = await Document.countDocuments({
      ...query,
      status: { $in: ["ready_for_review", "approved", "published"] }
    });

    // 4. Topics count
    const totalTopics = await Topic.countDocuments({ organization_id: orgId });
    const activeTopicsCount = await Topic.countDocuments({ organization_id: orgId, enabled: true });

    // 5. Last Indexed
    const lastIndexedDoc = await Document.findOne(query)
      .sort({ updated_at: -1 })
      .select("updated_at status")
      .lean();

    const avgRelsPerEntity = entityCount > 0 ? (relationshipCount / entityCount).toFixed(1) : "0.0";

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const newEntitiesThisWeek = await GraphNode.countDocuments({
      ...query,
      type: "entity",
      created_at: { $gte: oneWeekAgo }
    });

    let status = "Knowledge Base Healthy";
    if (lastIndexedDoc) {
      if (lastIndexedDoc.status === "processing") {
        status = "Indexing in Progress";
      } else if (lastIndexedDoc.status === "rejected") {
        status = "Indexing Failed";
      }
    } else {
      status = "No Index Data";
    }

    res.status(200).json({
      success: true,
      data: {
        entityCount,
        newEntitiesThisWeek,
        relationshipCount,
        avgRelsPerEntity,
        totalDocs,
        indexedDocs: readyDocs,
        totalTopics,
        activeTopics: activeTopicsCount,
        lastIndexed: lastIndexedDoc ? lastIndexedDoc.updated_at : null,
        status
      }
    });
  } catch (err) {
    console.error("[GraphController] getGraphStats failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-graph/index-status
 */
export const getIndexStatus = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const branchId = getBranchId(req);
    const query = { organization_id: new mongoose.Types.ObjectId(orgId) };
    if (branchId) {
      query.branch_id = new mongoose.Types.ObjectId(branchId);
    }

    // Documents breakdown
    const totalDocs = await Document.countDocuments(query);
    const uploadedDocs = await Document.countDocuments({ ...query, status: "uploaded" });
    const processingDocs = await Document.countDocuments({ ...query, status: "processing" });
    const failedDocs = await Document.countDocuments({ ...query, status: "rejected" });
    const indexedDocs = await Document.countDocuments({ ...query, status: { $in: ["ready_for_review", "approved", "published"] } });

    // Graph breakdown
    const nodeCount = await GraphNode.countDocuments(query);
    const edgeCount = await GraphRelationship.countDocuments(query);
    const lastIndexedDoc = await Document.findOne(query)
      .sort({ updated_at: -1 })
      .select("updated_at")
      .lean();

    // Vector Index Chunks
    const totalChunks = await DocumentChunk.countDocuments(query);
    const embeddedChunks = await DocumentChunk.countDocuments({
      ...query,
      $or: [
        { embedding: { $exists: true, $not: { $size: 0 } } },
        { status: { $in: ["published", "approved", "ready_for_review"] } }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        documents: {
          total: totalDocs,
          uploaded: uploadedDocs,
          processing: processingDocs,
          failed: failedDocs,
          indexed: indexedDocs
        },
        graph: {
          nodes: nodeCount,
          relationships: edgeCount,
          lastUpdated: lastIndexedDoc ? lastIndexedDoc.updated_at : null
        },
        vectorIndex: {
          chunks: totalChunks,
          indexed: embeddedChunks
        }
      }
    });
  } catch (err) {
    console.error("[GraphController] getIndexStatus failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-graph/entities
 */
export const getEntities = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const branchId = getBranchId(req);
    const query = {
      organization_id: new mongoose.Types.ObjectId(orgId),
      type: "entity"
    };
    if (branchId) {
      query.branch_id = new mongoose.Types.ObjectId(branchId);
    }

    const { search, type } = req.query;
    if (search && search.trim()) {
      query.name = { $regex: new RegExp(search.trim(), "i") };
    }
    if (type) {
      query["properties.entity_type"] = type;
    }

    const entities = await GraphNode.find(query).sort({ name: 1 }).limit(100).lean();
    res.status(200).json({ success: true, data: entities });
  } catch (err) {
    console.error("[GraphController] getEntities failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-graph/entities/:id
 */
export const getEntityById = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const node = await GraphNode.findOne({
      _id: req.params.id,
      organization_id: new mongoose.Types.ObjectId(orgId)
    }).lean();

    if (!node) {
      return res.status(404).json({ success: false, message: "Entity not found" });
    }

    res.status(200).json({ success: true, data: node });
  } catch (err) {
    console.error("[GraphController] getEntityById failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-graph/entities/:id/relationships
 */
export const getEntityRelationships = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const node = await GraphNode.findOne({
      _id: req.params.id,
      organization_id: new mongoose.Types.ObjectId(orgId)
    }).lean();

    if (!node) {
      return res.status(404).json({ success: false, message: "Entity not found" });
    }

    const rels = await GraphRelationship.find({
      organization_id: new mongoose.Types.ObjectId(orgId),
      $or: [
        { source_name: node.name },
        { target_name: node.name }
      ]
    }).populate("document_id", "title file_name").lean();

    res.status(200).json({ success: true, data: rels });
  } catch (err) {
    console.error("[GraphController] getEntityRelationships failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-graph/relationships
 */
export const getRelationships = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const branchId = getBranchId(req);
    const query = { organization_id: new mongoose.Types.ObjectId(orgId) };
    if (branchId) {
      query.branch_id = new mongoose.Types.ObjectId(branchId);
    }

    const { search, relationshipType, page = 1, limit = 10 } = req.query;

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { source_name: { $regex: searchRegex } },
        { target_name: { $regex: searchRegex } },
        { type: { $regex: searchRegex } }
      ];
    }

    if (relationshipType) {
      query.type = relationshipType;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await GraphRelationship.countDocuments(query);
    const rels = await GraphRelationship.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("document_id", "title file_name")
      .lean();

    const data = [];
    for (const rel of rels) {
      let topicName = "General";
      if (rel.document_id) {
        const docWithTopic = await Document.findById(rel.document_id).populate("topics", "name").lean();
        if (docWithTopic && docWithTopic.topics && docWithTopic.topics.length > 0) {
          topicName = docWithTopic.topics.map(t => t.name).join(", ");
        }
      }
      data.push({
        _id: rel._id.toString(),
        source_name: rel.source_name,
        source_type: rel.source_type,
        target_name: rel.target_name,
        target_type: rel.target_type,
        type: rel.type,
        topic: topicName,
        source: rel.document_id ? {
          _id: rel.document_id._id,
          title: rel.document_id.title,
          file_name: rel.document_id.file_name
        } : null,
        created_at: rel.created_at
      });
    }

    res.status(200).json({
      success: true,
      data: {
        relationships: data,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error("[GraphController] getRelationships failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-graph/topics
 */
export const getGraphTopics = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const topics = await Topic.find({ organization_id: new mongoose.Types.ObjectId(orgId) }).lean();
    const data = [];

    for (const topic of topics) {
      const topicRels = await GraphRelationship.find({
        organization_id: new mongoose.Types.ObjectId(orgId),
        target_name: topic.name,
        target_type: "topic",
        type: "HAS_TOPIC"
      }).lean();

      const chunkNames = topicRels
        .filter(r => r.source_type === "chunk")
        .map(r => r.source_name);

      const entityRelations = await GraphRelationship.find({
        organization_id: new mongoose.Types.ObjectId(orgId),
        source_name: { $in: chunkNames },
        source_type: "chunk",
        type: "HAS_ENTITY"
      }).lean();

      const entityNames = Array.from(new Set(entityRelations.map(r => r.target_name)));

      const relsCount = await GraphRelationship.countDocuments({
        organization_id: new mongoose.Types.ObjectId(orgId),
        source_name: { $in: entityNames },
        source_type: "entity",
        target_name: { $in: entityNames },
        target_type: "entity"
      });

      data.push({
        _id: topic._id,
        name: topic.name,
        description: topic.description,
        enabled: topic.enabled,
        entityCount: entityNames.length,
        relationshipCount: relsCount
      });
    }

    res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("[GraphController] getGraphTopics failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-graph/search
 */
export const searchGraph = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const branchId = getBranchId(req);
    const queryText = req.query.name || req.query.query || "";

    if (!queryText || !queryText.trim()) {
      return res.status(200).json({ success: true, data: [] });
    }

    const regex = new RegExp(queryText.trim(), "i");

    const nodeQuery = {
      organization_id: new mongoose.Types.ObjectId(orgId),
      name: { $regex: regex }
    };
    if (branchId) {
      nodeQuery.branch_id = new mongoose.Types.ObjectId(branchId);
    }

    const matchedNodes = await GraphNode.find(nodeQuery).limit(50).lean();
    const results = [];

    for (const node of matchedNodes) {
      const relCount = await GraphRelationship.countDocuments({
        organization_id: new mongoose.Types.ObjectId(orgId),
        $or: [{ source_name: node.name }, { target_name: node.name }]
      });

      const docsRels = await GraphRelationship.find({
        organization_id: new mongoose.Types.ObjectId(orgId),
        $or: [
          { source_name: node.name, target_type: "document" },
          { target_name: node.name, source_type: "document" },
          { target_name: node.name, type: "HAS_ENTITY" },
          { target_name: node.name, type: "HAS_TOPIC" },
          { target_name: node.name, type: "HAS_CHUNK" }
        ]
      }).populate("document_id", "title").limit(5).lean();

      const documentNames = new Set();
      docsRels.forEach(r => {
        if (r.document_id && r.document_id.title) {
          documentNames.add(r.document_id.title);
        } else if (r.source_type === "document") {
          documentNames.add(r.source_name);
        } else if (r.target_type === "document") {
          documentNames.add(r.target_name);
        }
      });

      const topicRels = await GraphRelationship.find({
        organization_id: new mongoose.Types.ObjectId(orgId),
        $or: [
          { source_name: node.name, target_type: "topic" },
          { target_name: node.name, source_type: "topic" }
        ],
        type: "HAS_TOPIC"
      }).limit(1).lean();

      let topicName = "";
      if (topicRels.length > 0) {
        topicName = topicRels[0].source_type === "topic" ? topicRels[0].source_name : topicRels[0].target_name;
      }

      results.push({
        id: node._id.toString(),
        name: node.name,
        type: node.type === "entity" ? (node.properties?.entity_type || "Entity") : node.type,
        topic: topicName || "General",
        documents: Array.from(documentNames),
        relationshipCount: relCount
      });
    }

    res.status(200).json({ success: true, data: results });
  } catch (err) {
    console.error("[GraphController] searchGraph failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-graph/subgraph
 */
export const getSubgraph = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const branchId = getBranchId(req);
    const { topic, entityType, documentId, relationshipType, search, hideIsolated } = req.query;
    let depth = parseInt(req.query.depth) || 2;
    if (depth < 1) depth = 1;
    if (depth > 5) depth = 5;

    let relQuery = { organization_id: new mongoose.Types.ObjectId(orgId) };
    if (branchId) {
      relQuery.branch_id = new mongoose.Types.ObjectId(branchId);
    }

    if (documentId) {
      relQuery.document_id = new mongoose.Types.ObjectId(documentId);
    }
    if (relationshipType) {
      relQuery.type = relationshipType;
    }

    let relationships = await GraphRelationship.find(relQuery).lean();

    let nodeQuery = { organization_id: new mongoose.Types.ObjectId(orgId) };
    if (branchId) {
      nodeQuery.branch_id = new mongoose.Types.ObjectId(branchId);
    }
    let nodes = await GraphNode.find(nodeQuery).lean();

    if (topic) {
      const topicRecord = await Topic.findOne({
        $or: [
          { _id: mongoose.isValidObjectId(topic) ? new mongoose.Types.ObjectId(topic) : null },
          { name: topic }
        ],
        organization_id: new mongoose.Types.ObjectId(orgId)
      }).lean();

      if (topicRecord) {
        const topicName = topicRecord.name;
        const topicRels = await GraphRelationship.find({
          organization_id: new mongoose.Types.ObjectId(orgId),
          target_name: topicName,
          type: "HAS_TOPIC"
        }).lean();

        const connectedNames = new Set([topicName]);
        topicRels.forEach(r => connectedNames.add(r.source_name));

        const entityRels = await GraphRelationship.find({
          organization_id: new mongoose.Types.ObjectId(orgId),
          source_name: { $in: Array.from(connectedNames) },
          type: "HAS_ENTITY"
        }).lean();
        entityRels.forEach(r => connectedNames.add(r.target_name));

        relationships = relationships.filter(r =>
          connectedNames.has(r.source_name) || connectedNames.has(r.target_name)
        );
      }
    }

    if (entityType) {
      const targetNodeNames = new Set(
        nodes
          .filter(n => n.type === "entity" && n.properties?.entity_type?.toLowerCase() === entityType.toLowerCase())
          .map(n => n.name)
      );
      relationships = relationships.filter(r =>
        targetNodeNames.has(r.source_name) || targetNodeNames.has(r.target_name)
      );
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      const matchedNodeNames = new Set(
        nodes
          .filter(n => searchRegex.test(n.name) || (n.properties?.entity_type && searchRegex.test(n.properties.entity_type)))
          .map(n => n.name)
      );

      if (matchedNodeNames.size > 0) {
        let currentLevel = new Set(matchedNodeNames);
        let visited = new Set(matchedNodeNames);
        let traversedRels = [];

        for (let i = 0; i < depth; i++) {
          const nextLevel = new Set();
          const levelRels = relationships.filter(r =>
            currentLevel.has(r.source_name) || currentLevel.has(r.target_name)
          );

          levelRels.forEach(r => {
            traversedRels.push(r);
            if (!visited.has(r.source_name)) {
              nextLevel.add(r.source_name);
              visited.add(r.source_name);
            }
            if (!visited.has(r.target_name)) {
              nextLevel.add(r.target_name);
              visited.add(r.target_name);
            }
          });
          currentLevel = nextLevel;
          if (currentLevel.size === 0) break;
        }

        const relIds = new Set();
        relationships = traversedRels.filter(r => {
          const key = `${r.source_name}-${r.target_name}-${r.type}`;
          if (relIds.has(key)) return false;
          relIds.add(key);
          return true;
        });
      } else {
        relationships = [];
      }
    }

    const activeNodeNames = new Set();
    relationships.forEach(r => {
      activeNodeNames.add(r.source_name);
      activeNodeNames.add(r.target_name);
    });

    let finalNodes = nodes.map(n => {
      const relCount = relationships.filter(r => r.source_name === n.name || r.target_name === n.name).length;
      return {
        id: n._id.toString(),
        name: n.name,
        type: n.type === "entity" ? (n.properties?.entity_type || "Entity") : n.type,
        ref_id: n.ref_id,
        properties: n.properties || {},
        relationshipCount: relCount
      };
    });

    if (hideIsolated === "true" || hideIsolated === true) {
      finalNodes = finalNodes.filter(n => activeNodeNames.has(n.name));
    } else {
      finalNodes = finalNodes.filter(n => activeNodeNames.has(n.name) || n.relationshipCount > 0);
    }

    if (finalNodes.length > 300) {
      finalNodes = finalNodes.slice(0, 300);
      const nodeNames = new Set(finalNodes.map(n => n.name));
      relationships = relationships.filter(r => nodeNames.has(r.source_name) && nodeNames.has(r.target_name));
    }

    res.status(200).json({
      success: true,
      data: {
        nodes: finalNodes,
        relationships: relationships.map(r => ({
          id: r._id.toString(),
          source: r.source_name,
          target: r.target_name,
          type: r.type,
          document_id: r.document_id
        }))
      }
    });
  } catch (err) {
    console.error("[GraphController] getSubgraph failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /knowledge-graph/reindex
 */
export const reindexKnowledge = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const branchId = getBranchId(req);
    const userRole = req.scope?.role;
    if (!["super_admin", "admin", "branch_admin"].includes(userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden: Requires manager or admin role" });
    }

    let docQuery = { organization_id: new mongoose.Types.ObjectId(orgId) };
    if (branchId) {
      docQuery.branch_id = new mongoose.Types.ObjectId(branchId);
    }

    const docs = await Document.find(docQuery).select("_id currentVersionId").lean();

    if (docs.length === 0) {
      return res.status(200).json({ success: true, message: "No documents found to reindex." });
    }

    setImmediate(async () => {
      console.log(`[Reindexing] Started knowledge reindex for organization ${orgId}`);
      for (const doc of docs) {
        if (doc.currentVersionId) {
          try {
            await processDocument(doc._id, doc.currentVersionId);
          } catch (err) {
            console.error(`[Reindexing] Reprocessing failed for doc ${doc._id}:`, err.message);
          }
        }
      }
      console.log(`[Reindexing] Completed knowledge reindex for organization ${orgId}`);
    });

    res.status(200).json({
      success: true,
      message: "Knowledge reindexing started in the background. It will rebuild the entity graph shortly."
    });
  } catch (err) {
    console.error("[GraphController] reindexKnowledge failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /knowledge-graph/rebuild
 */
export const rebuildGraph = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }

    const branchId = getBranchId(req);
    const userRole = req.scope?.role;
    if (!["super_admin", "admin"].includes(userRole)) {
      return res.status(403).json({ success: false, message: "Forbidden: Requires administrator role" });
    }

    let query = { organization_id: new mongoose.Types.ObjectId(orgId) };
    if (branchId) {
      query.branch_id = new mongoose.Types.ObjectId(branchId);
    }

    await GraphNode.deleteMany(query);
    await GraphRelationship.deleteMany(query);

    const docs = await Document.find(query).select("_id currentVersionId").lean();

    setImmediate(async () => {
      console.log(`[RebuildGraph] Rebuilding graph for organization ${orgId}`);
      for (const doc of docs) {
        if (doc.currentVersionId) {
          try {
            await processDocument(doc._id, doc.currentVersionId);
          } catch (err) {
            console.error(`[RebuildGraph] Reprocessing failed for doc ${doc._id}:`, err.message);
          }
        }
      }
      console.log(`[RebuildGraph] Completed rebuild for organization ${orgId}`);
    });

    res.status(200).json({
      success: true,
      message: "Knowledge graph cleared and rebuild started in the background."
    });
  } catch (err) {
    console.error("[GraphController] rebuildGraph failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
