import express from "express";
import * as ragController from "./rag.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { ingestSchema, querySchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/ingest", restrict("super admin", "tenant admin", "admin", "agent"), validate(ingestSchema), ragController.ingest);
router.post("/query", validate(querySchema), ragController.query);
router.get("/stats", restrict("super admin", "tenant admin", "admin"), ragController.getStats);
router.get("/graph/stats", restrict("super admin", "tenant admin", "admin"), ragController.getGlobalStats);
router.get("/graph/:documentId", restrict("super admin", "tenant admin", "admin", "agent"), ragController.getDocumentGraph);
router.get("/chunks/:documentId", restrict("super admin", "tenant admin", "admin", "agent"), ragController.getDocumentChunks);
router.get("/search", restrict("super admin", "tenant admin", "admin", "agent"), ragController.searchByKeyword);
router.delete("/:documentId", restrict("super admin", "tenant admin", "admin"), ragController.removeDocumentData);

export default router;
