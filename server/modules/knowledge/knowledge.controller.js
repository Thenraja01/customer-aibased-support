import mongoose from "mongoose";
import KnowledgeNode from "./knowledgeNode.schema.js";
import {
  createKnowledgeNodeTransactional,
  updateKnowledgeNodeTransactional,
  deleteKnowledgeNodeTransactional,
  getPrerequisiteTree,
  getPolicyResolutionGraph,
  getNodeNeighborhood,
  retrieveHybridKnowledgeGraph,
} from "./knowledge.service.js";

/**
 * Resolve organization ID from request based on user/token scope
 */
const getOrgId = (req) => {
  if (req.scope?.isSuperAdmin) {
    return req.query.organizationId || req.params.organizationId || req.body.orgId || req.user?.organizationId || null;
  }
  return req.scope?.organizationId || req.user?.organizationId || req.body.orgId || null;
};

/**
 * Resolve branch ID from request based on user/token scope
 */
const getBranchId = (req) => {
  if (req.scope?.isSuperAdmin || req.scope?.isOrgAdmin) {
    return req.query.branchId || req.params.branchId || req.body.branchId || null;
  }
  return req.scope?.branchId || req.user?.branchId || null;
};

/**
 * POST /knowledge-nodes
 * Create a new Knowledge Node (with ChromaDB Dual-Write Transaction)
 */
export const createNode = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const branchId = getBranchId(req);

    const { title, content, category, tags, nodeType, relatedNodes, metadata } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({
        success: false,
        message: "Title, content, and category are mandatory fields",
      });
    }

    const node = await createKnowledgeNodeTransactional(
      {
        title,
        content,
        category,
        tags: tags || [],
        nodeType: nodeType || "article",
        relatedNodes: relatedNodes || [],
        metadata: metadata || {},
      },
      orgId,
      branchId
    );

    res.status(201).json({
      success: true,
      message: "Knowledge node created successfully with atomic ChromaDB sync",
      data: node,
    });
  } catch (err) {
    console.error("[KnowledgeController] createNode error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * PUT /knowledge-nodes/:id
 * Update an existing Knowledge Node (with ChromaDB Dual-Write Transaction)
 */
export const updateNode = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const branchId = getBranchId(req);
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid Knowledge Node ID" });
    }

    const updated = await updateKnowledgeNodeTransactional(id, req.body, orgId, branchId);

    res.status(200).json({
      success: true,
      message: "Knowledge node updated successfully with atomic ChromaDB sync",
      data: updated,
    });
  } catch (err) {
    console.error("[KnowledgeController] updateNode error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * DELETE /knowledge-nodes/:id
 * Delete a Knowledge Node (with ChromaDB Dual-Write Transaction)
 */
export const deleteNode = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const branchId = getBranchId(req);
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: "Invalid Knowledge Node ID" });
    }

    const result = await deleteKnowledgeNodeTransactional(id, orgId, branchId);

    res.status(200).json({
      success: true,
      message: "Knowledge node deleted successfully across MongoDB and ChromaDB",
      data: result,
    });
  } catch (err) {
    console.error("[KnowledgeController] deleteNode error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-nodes
 * List Knowledge Nodes with filtering and pagination
 */
export const listNodes = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const branchId = getBranchId(req);

    const { category, nodeType, tag, search, page = 1, limit = 20 } = req.query;

    const query = { orgId: new mongoose.Types.ObjectId(orgId) };
    if (branchId) query.branchId = new mongoose.Types.ObjectId(branchId);
    if (category) query.category = category;
    if (nodeType) query.nodeType = nodeType;
    if (tag) query.tags = tag;
    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await KnowledgeNode.countDocuments(query);
    const nodes = await KnowledgeNode.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("relatedNodes.targetNodeId", "title category nodeType")
      .lean();

    res.status(200).json({
      success: true,
      data: {
        nodes,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("[KnowledgeController] listNodes error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-nodes/:id
 * Fetch single Knowledge Node with populated edges
 */
export const getNodeById = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const branchId = getBranchId(req);
    const { id } = req.params;

    const query = { _id: id, orgId: new mongoose.Types.ObjectId(orgId) };
    if (branchId) query.branchId = new mongoose.Types.ObjectId(branchId);

    const node = await KnowledgeNode.findOne(query)
      .populate("relatedNodes.targetNodeId", "title category nodeType")
      .lean();

    if (!node) {
      return res.status(404).json({ success: false, message: "Knowledge node not found" });
    }

    res.status(200).json({ success: true, data: node });
  } catch (err) {
    console.error("[KnowledgeController] getNodeById error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-nodes/:id/prerequisites
 * Traversal 1: Prerequisite Hierarchy via $graphLookup (replacing Neo4j Cypher)
 */
export const getPrerequisites = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const branchId = getBranchId(req);
    const { id } = req.params;
    const depth = parseInt(req.query.depth) || 3;

    const tree = await getPrerequisiteTree(id, orgId, branchId, depth);
    if (!tree) {
      return res.status(404).json({ success: false, message: "Knowledge node not found" });
    }

    res.status(200).json({ success: true, data: tree });
  } catch (err) {
    console.error("[KnowledgeController] getPrerequisites error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-nodes/policy-graph
 * Traversal 2: Policy Tree via $graphLookup (replacing Neo4j Cypher)
 */
export const getPolicyGraph = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const branchId = getBranchId(req);
    const category = req.query.category || "Policy";
    const depth = parseInt(req.query.depth) || 3;

    const graph = await getPolicyResolutionGraph(category, orgId, branchId, depth);

    res.status(200).json({ success: true, data: graph });
  } catch (err) {
    console.error("[KnowledgeController] getPolicyGraph error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /knowledge-nodes/:id/neighborhood
 * Traversal 3: Bidirectional K-Hop Neighborhood Explorer
 */
export const getNeighborhood = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const branchId = getBranchId(req);
    const { id } = req.params;
    const depth = parseInt(req.query.depth) || 2;

    const neighborhood = await getNodeNeighborhood(id, orgId, branchId, depth);
    if (!neighborhood) {
      return res.status(404).json({ success: false, message: "Node not found" });
    }

    res.status(200).json({ success: true, data: neighborhood });
  } catch (err) {
    console.error("[KnowledgeController] getNeighborhood error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * POST /knowledge-nodes/hybrid-search
 * Vector KNN Search (ChromaDB) + MongoDB $graphLookup sub-graph expansion (<30ms)
 */
export const hybridSearch = async (req, res) => {
  try {
    const orgId = getOrgId(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const branchId = getBranchId(req);
    const { query, limit = 5, depth = 2 } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: "Search query string is required" });
    }

    const result = await retrieveHybridKnowledgeGraph(query.trim(), orgId, branchId, limit, depth);

    res.status(200).json({
      success: true,
      latencyMs: result.latencyMs,
      data: result.seedNodes,
    });
  } catch (err) {
    console.error("[KnowledgeController] hybridSearch error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
