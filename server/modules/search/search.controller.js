import * as searchService from "./search.service.js";

export const query = async (req, res) => {
  try {
    const { q, type, category, dateFrom, dateTo, userId, status, page, limit } = req.query;
    const orgId = req.user?.organizationId;
    const isSuperAdmin = req.user?.roleName?.toLowerCase() === "super_admin";

    const results = await searchService.search({
      query: q || "",
      type,
      category,
      dateFrom,
      dateTo,
      userId,
      status,
      organizationId: isSuperAdmin ? null : orgId,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });

    res.status(200).json({ success: true, ...results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
