import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";
import * as graphController from "./graph.controller.js";

const router = express.Router();

router.use(protect);
router.use(attachScope);

router.get("/stats", graphController.getGraphStats);
router.get("/index-status", graphController.getIndexStatus);
router.get("/entities", graphController.getEntities);
router.get("/entities/:id", graphController.getEntityById);
router.get("/entities/:id/relationships", graphController.getEntityRelationships);
router.get("/relationships", graphController.getRelationships);
router.get("/topics", graphController.getGraphTopics);
router.get("/search", graphController.searchGraph);
router.get("/subgraph", graphController.getSubgraph);
router.post("/reindex", graphController.reindexKnowledge);
router.post("/rebuild", graphController.rebuildGraph);

// Legacy routes for backward compatibility
router.get("/stats/:documentId", graphController.getGraphStats);
router.get("/traverse", graphController.searchGraph);

export default router;
