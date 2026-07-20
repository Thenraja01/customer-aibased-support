import express from "express";
import * as documentCommentController from "./documentComment.controller.js";
import { protect, restrict } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createDocumentCommentSchema, updateDocumentCommentSchema } from "../../validation/index.js";

const router = express.Router();

router.use(protect);

router.post("/", validate(createDocumentCommentSchema), documentCommentController.create);
router.get("/", restrict("admin", "support"), documentCommentController.getAll);
router.get("/document/:documentId", documentCommentController.getByDocument);
router.get("/:commentId/replies", documentCommentController.getReplies);
router.put("/:id", validate(updateDocumentCommentSchema), documentCommentController.update);
router.delete("/:id", documentCommentController.remove);

export default router;
