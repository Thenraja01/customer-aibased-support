import * as topicService from "./topic.service.js";

export const getTopics = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization_id?._id || req.user.organization_id;
    const { search, enabled } = req.query;
    
    const filters = {};
    if (search) filters.search = search;
    if (enabled !== undefined) filters.enabled = enabled === "true";

    const topics = await topicService.getTopics(orgId, filters);
    res.status(200).json({ success: true, data: topics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createTopic = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization_id?._id || req.user.organization_id;
    const topic = await topicService.createTopic(orgId, req.body);
    res.status(201).json({ success: true, data: topic });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const updateTopic = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization_id?._id || req.user.organization_id;
    const topic = await topicService.updateTopic(req.params.id, orgId, req.body);
    res.status(200).json({ success: true, data: topic });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const deleteTopic = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization_id?._id || req.user.organization_id;
    const result = await topicService.deleteTopic(req.params.id, orgId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getTopicDocuments = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization_id?._id || req.user.organization_id;
    const docs = await topicService.getTopicDocuments(req.params.id, orgId);
    res.status(200).json({ success: true, data: docs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopicChunks = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization_id?._id || req.user.organization_id;
    const chunks = await topicService.getTopicChunks(req.params.id, orgId);
    res.status(200).json({ success: true, data: chunks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getTopicGraph = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization_id?._id || req.user.organization_id;
    const graphData = await topicService.getTopicGraph(req.params.id, orgId);
    res.status(200).json({ success: true, data: graphData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const reindexTopicDocuments = async (req, res) => {
  try {
    const orgId = req.user.organizationId || req.user.organization_id?._id || req.user.organization_id;
    const result = await topicService.reindexTopicDocuments(req.params.id, orgId);
    res.status(200).json({ success: true, count: result.count, message: `Successfully queued re-indexing for ${result.count} documents.` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
