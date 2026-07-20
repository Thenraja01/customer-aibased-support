import * as chatAnalyticsService from "./chatAnalytics.service.js";

export const getByChatId = async (req, res) => {
  try {
    const analytics = await chatAnalyticsService.getAnalyticsByChatId(req.params.chatId);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    const status = error.message === "Chat analytics not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.organization_id) query.organization_id = req.query.organization_id;
    const analytics = await chatAnalyticsService.getAllAnalytics(query);
    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await chatAnalyticsService.getAnalyticsStats(req.query.organization_id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await chatAnalyticsService.deleteAnalytics(req.params.chatId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Chat analytics not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
