import express from "express";
import * as kgController from "./knowledgeGraph.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/document/:documentId", restrict("admin", "support"), kgController.getNodesByDocument);
router.get("/search", restrict("admin", "support"), kgController.searchNodes);
router.get("/traverse", restrict("admin", "support"), kgController.traverse);
router.get("/stats/:documentId", restrict("admin"), kgController.getStats);
router.get("/:id", restrict("admin", "support"), kgController.getNodeById);

export default router;
