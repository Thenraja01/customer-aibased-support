import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as topicController from "./topic.controller.js";

const router = express.Router();

// All topic routes are protected
router.use(protect);

router.route("/")
  .get(topicController.getTopics)
  .post(topicController.createTopic);

router.route("/:id")
  .put(topicController.updateTopic)
  .delete(topicController.deleteTopic);

router.get("/:id/documents", topicController.getTopicDocuments);
router.get("/:id/chunks", topicController.getTopicChunks);
router.get("/:id/graph", topicController.getTopicGraph);
router.post("/:id/reindex", topicController.reindexTopicDocuments);

export default router;
