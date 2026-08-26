import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";
import * as agentController from "./agent.controller.js";

const router = express.Router();

// Apply auth and scope middleware to all routes
router.use(protect);
router.use(attachScope);

// GET /api/agent/health
router.get("/health", agentController.getModelHealth);

// POST /api/agent/test-provider
router.post("/test-provider", agentController.testProvider);

// POST /api/agent/switch-provider
router.post("/switch-provider", agentController.switchProvider);

// POST /api/agent/test-failover
router.post("/test-failover", agentController.testFailover);

// POST /api/agent/test-pipeline
router.post("/test-pipeline", agentController.testPipeline);

// GET /api/agent/health-diagnostics
router.get("/health-diagnostics", agentController.getHealthDiagnostics);

// POST /api/agent/explain-routing
router.post("/explain-routing", agentController.explainRouting);

// GET /api/agent/knowledge-conflicts
router.get("/knowledge-conflicts", agentController.detectKnowledgeConflicts);

// POST /api/agent/evaluate-confidence
router.post("/evaluate-confidence", agentController.evaluateAnswerConfidence);

// POST /api/agent/simulate-whatif
router.post("/simulate-whatif", agentController.runWhatIfSimulation);

export default router;
