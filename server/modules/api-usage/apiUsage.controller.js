import * as apiUsageService from "./apiUsage.service.js";

export const getAll = async (req, res) => {
  try {
    const usage = await apiUsageService.getAll(req.query);
    res.status(200).json({ success: true, data: usage });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await apiUsageService.getStats(req.query.organization_id);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDailyStats = async (req, res) => {
  try {
    const stats = await apiUsageService.getDailyStats(req.query.organization_id, req.query.days);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const cleanup = async (req, res) => {
  try {
    const result = await apiUsageService.cleanupOldRecords();
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
