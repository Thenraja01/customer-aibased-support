import express from "express";
import * as kgController from "./knowledgeGraph.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/document/:documentId", restrict("admin", "agent"), kgController.getNodesByDocument);
router.get("/search", restrict("admin", "agent"), kgController.searchNodes);
router.get("/traverse", restrict("admin", "agent"), kgController.traverse);
router.get("/stats/:documentId", restrict("admin"), kgController.getStats);
router.get("/:id", restrict("admin", "agent"), kgController.getNodeById);

export default router;
