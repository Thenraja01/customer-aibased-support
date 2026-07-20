import * as searchService from "./search.service.js";

export const global = async (req, res) => {
  try {
    const { q, type, page, limit } = req.query;
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }
    const results = await searchService.globalSearch({
      query: q,
      type: type || "all",
      organizationId: req.organization?._id || req.user.organizationId,
      userId: req.user.userId,
      roleName: req.user.roleName,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
    res.status(200).json({ success: true, data: results.results, meta: { total: results.total, page: results.page, limit: results.limit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const documents = async (req, res) => {
  try {
    const { q, page, limit } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Search query is required" });
    const results = await searchService.searchDocuments({
      query: q,
      organizationId: req.organization?._id || req.user.organizationId,
      userId: req.user.userId,
      roleName: req.user.roleName,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
    res.status(200).json({ success: true, data: results.data, meta: { total: results.total, page: results.page, limit: results.limit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const tickets = async (req, res) => {
  try {
    const { q, page, limit } = req.query;
    if (!q) return res.status(400).json({ success: false, message: "Search query is required" });
    const results = await searchService.searchTickets({
      query: q,
      organizationId: req.organization?._id || req.user.organizationId,
      userId: req.user.userId,
      roleName: req.user.roleName,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
    res.status(200).json({ success: true, data: results.data, meta: { total: results.total, page: results.page, limit: results.limit } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
