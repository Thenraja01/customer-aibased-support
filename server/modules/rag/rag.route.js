import express from "express";
import * as ragController from "./rag.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { ingestSchema, querySchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/ingest", restrict("admin", "support"), validate(ingestSchema), ragController.ingest);
router.post("/query", validate(querySchema), ragController.query);
router.get("/stats", restrict("admin"), ragController.getStats);
router.get("/graph/stats", restrict("admin"), ragController.getGlobalStats);
router.get("/graph/:documentId", restrict("admin", "support"), ragController.getDocumentGraph);
router.get("/chunks/:documentId", restrict("admin", "support"), ragController.getDocumentChunks);
router.get("/search", restrict("admin", "support"), ragController.searchByKeyword);
router.delete("/:documentId", restrict("admin"), ragController.removeDocumentData);

export default router;
