import * as promptService from "./promptVersion.service.js";

export const getPrompt = async (req, res) => {
  try {
    const orgId = req.params.orgId || req.user?.organizationId;
    const data = await promptService.getCurrentPrompt(orgId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveDraft = async (req, res) => {
  try {
    const orgId = req.params.orgId || req.user?.organizationId;
    const { system_prompt } = req.body;
    const result = await promptService.saveDraft(orgId, system_prompt, req.user?.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const publish = async (req, res) => {
  try {
    const orgId = req.params.orgId || req.user?.organizationId;
    const result = await promptService.publishPrompt(orgId, req.user?.userId);
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const rollback = async (req, res) => {
  try {
    const orgId = req.params.orgId || req.user?.organizationId;
    const version = parseInt(req.params.version);
    const result = await promptService.rollbackPrompt(orgId, version, req.user?.userId);
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    const status = error.message.startsWith("Version") ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getHistory = async (req, res) => {
  try {
    const orgId = req.params.orgId || req.user?.organizationId;
    const history = await promptService.getVersionHistory(orgId);
    res.status(200).json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
