import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";
import {
  createNode,
  updateNode,
  deleteNode,
  listNodes,
  getNodeById,
  getPrerequisites,
  getPolicyGraph,
  getNeighborhood,
  hybridSearch,
} from "./knowledge.controller.js";

const router = express.Router();

// Apply auth and multi-tenant scoping to all knowledge routes
router.use(protect);
router.use(attachScope);

// Specialized Graph Traversal Endpoints (MongoDB $graphLookup native)
router.get("/policy-graph", getPolicyGraph);
router.post("/hybrid-search", hybridSearch);
router.get("/:id/prerequisites", getPrerequisites);
router.get("/:id/neighborhood", getNeighborhood);

// Standard CRUD Endpoints
router.post("/", createNode);
router.get("/", listNodes);
router.get("/:id", getNodeById);
router.put("/:id", updateNode);
router.delete("/:id", deleteNode);

export default router;
