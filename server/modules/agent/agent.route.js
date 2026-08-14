import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";
import * as agentController from "./agent.controller.js";

const router = express.Router();

// Apply auth and scope middleware to all routes
router.use(protect);
router.use(attachScope);

// POST /api/agent/message
router.post("/message", agentController.processMessage);

// GET /api/agent/flows
router.get("/flows", agentController.listFlows);

// GET /api/agent/health
router.get("/health", agentController.getModelHealth);

export default router;
