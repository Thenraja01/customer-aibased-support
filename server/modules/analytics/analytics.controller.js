import * as analyticsService from "./analytics.service.js";

const orgIdFrom = (req) => req.scope?.organizationId || req.user?.organizationId;

export const getOverview = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 30));
    const overview = await analyticsService.getAnalyticsOverview(orgId, { days });
    res.status(200).json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAIUsage = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const days = Math.min(90, Math.max(1, parseInt(req.query.days, 10) || 30));
    const data = await analyticsService.getAIUsageAnalytics(orgId, {
      days,
      from: req.query.from,
      to: req.query.to,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export default {
  getOverview,
  getAIUsage,
};