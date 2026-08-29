import express from "express";
import * as ragController from "./rag.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { attachScope } from "../../middleware/branchScope.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { ingestSchema, querySchema } from "../../validation/index.js";

const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);

// Attach scope context for downstream branch-isolated RAG queries
router.use(attachScope);

router.post("/ingest", checkRole(...ADMIN), validate(ingestSchema), ragController.ingest);
router.post("/query", validate(querySchema), ragController.query);
router.get("/stats", checkRole(...ADMIN), ragController.getStats);
router.get("/chunks/:documentId", checkRole(...ADMIN), ragController.getDocumentChunks);
router.get("/search", checkRole(...ADMIN), ragController.searchByKeyword);
router.delete("/:documentId", checkRole("admin"), ragController.removeDocumentData);

export default router;