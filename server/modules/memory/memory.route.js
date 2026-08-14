import express from "express";
import * as memoryController from "./memory.controller.js";
import { protect, selfOrAdminParam } from "../../middleware/auth.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { storeMemorySchema, updateMemorySchema } from "../../validation/index.js";

// RBAC: admin / branch_admin may write/remove long-term memories.
const ADMIN = ["admin", "branch_admin"];

const router = express.Router();

router.use(protect);

router.post("/store", checkRole(...ADMIN), validate(storeMemorySchema), memoryController.store);
router.get("/user/:userId", selfOrAdminParam("userId"), memoryController.getUserMemories);
router.get("/user/:userId/search", selfOrAdminParam("userId"), memoryController.searchByKeyword);
router.get("/user/:userId/relevant", selfOrAdminParam("userId"), memoryController.getRelevant);
router.get("/user/:userId/stats", selfOrAdminParam("userId"), memoryController.getStats);
router.get("/user/:userId/context", selfOrAdminParam("userId"), memoryController.getContext);
router.post("/user/:userId/extract", selfOrAdminParam("userId"), memoryController.extractFacts);
router.patch("/:memoryId", checkRole(...ADMIN), validate(updateMemorySchema), memoryController.update);
router.delete("/:memoryId", checkRole(...ADMIN), memoryController.remove);
router.delete("/user/:userId", selfOrAdminParam("userId"), memoryController.removeUserMemories);
router.get("/chat/:chatId/short-term", memoryController.loadShortTerm);
router.delete("/chat/:chatId/short-term", memoryController.clearShortTerm);

export default router;