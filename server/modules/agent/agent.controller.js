import agentService from "./agentService.js";

export const processMessage = async (req, res) => {
  try {
    const { message, modelName, actionConfirm, provider, chatId } = req.body;
    
    // Call agent service
    const result = await agentService.processAgentMessage({
      chatId,
      user: req.user || req.scope, // depending on how auth middleware attaches it
      message,
      modelName,
      actionConfirm,
      provider
    });

    res.status(200).json(result);
  } catch (err) {
    console.error("[AgentController] processMessage failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /agent/flows
 * Lists agent flows.
 */
export const listFlows = async (req, res) => {
  try {
    const { limit = 20, skip = 0, status } = req.query;
    // Get organizationId from scope/user
    const organizationId = req.scope?.organizationId || req.user?.organizationId;
    
    const result = await agentService.listFlows({
      organizationId,
      limit: parseInt(limit, 10),
      skip: parseInt(skip, 10),
      status
    });

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    console.error("[AgentController] listFlows failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * GET /agent/health
 * Gets model health metrics.
 */
export const getModelHealth = async (req, res) => {
  try {
    const organizationId = req.scope?.organizationId || req.user?.organizationId;
    
    const result = await agentService.getModelHealth({ organizationId });

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error("[AgentController] getModelHealth failed:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};
