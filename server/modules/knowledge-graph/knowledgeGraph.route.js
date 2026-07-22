import express from "express";
import * as kgController from "./knowledgeGraph.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";

const router = express.Router();

router.use(protect);

router.get("/document/:documentId", restrict("super admin", "tenant admin", "admin", "support"), kgController.getNodesByDocument);
router.get("/search", restrict("super admin", "tenant admin", "admin", "support"), kgController.searchNodes);
router.get("/traverse", restrict("super admin", "tenant admin", "admin", "support"), kgController.traverse);
router.get("/stats/:documentId", restrict("super admin", "tenant admin", "admin"), kgController.getStats);
router.get("/:id", restrict("super admin", "tenant admin", "admin", "support"), kgController.getNodeById);

export default router;
