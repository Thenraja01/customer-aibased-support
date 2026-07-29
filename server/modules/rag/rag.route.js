import express from "express";
import * as ragController from "./rag.controller.js";
import { protect, access } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { ingestSchema, querySchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/ingest", access("ai.upload_documents"), validate(ingestSchema), ragController.ingest);
router.post("/query", validate(querySchema), ragController.query);
router.get("/stats", access("ai.train_kb"), ragController.getStats);
router.get("/chunks/:documentId", access("document.view_all"), ragController.getDocumentChunks);
router.get("/search", access("document.view_all"), ragController.searchByKeyword);
router.delete("/:documentId", access("document.delete"), ragController.removeDocumentData);

export default router;