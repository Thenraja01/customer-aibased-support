import express from "express";
import { protect } from "../../middleware/auth.middleware.js";
import * as adminService from "../admin/admin.service.js";

const router = express.Router();

router.use(protect);

router.get("/v1/dashboard", async (req, res) => {
  try {
    const orgId = req.user.organizationId || null;
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/usage", async (req, res) => {
  try {
    const stats = await adminService.getAnalyticsDashboard(req.user.organizationId || null);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/response-times", async (req, res) => {
  try {
    res.status(200).json({ success: true, data: { avgResponseTime: 0, avgResolutionTime: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/token-usage", async (req, res) => {
  try {
    const { default: AISession } = await import("../ai-session/aiSession.schema.js");
    const stats = await AISession.aggregate([
      { $match: { organization_id: req.user.organizationId || { $exists: true } } },
      { $group: { _id: null, totalTokens: { $sum: "$total_tokens" }, totalCost: { $sum: "$cost" } } },
    ]);
    res.status(200).json({ success: true, data: stats[0] || { totalTokens: 0, totalCost: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/sessions", async (req, res) => {
  try {
    const { default: ChatAnalytics } = await import("../chat-analytics/chatAnalytics.schema.js");
    const sessions = await ChatAnalytics.find().sort({ created_at: -1 }).limit(10).lean();
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/ai", async (req, res) => {
  try {
    const { default: AISession } = await import("../ai-session/aiSession.schema.js");
    const stats = await AISession.aggregate([
      { $match: { organization_id: req.user.organizationId || { $exists: true } } },
      { $group: { _id: null, totalAIResponses: { $sum: 1 }, avgConfidence: { $avg: "$confidence" } } },
    ]);
    res.status(200).json({ success: true, data: stats[0] || { totalAIResponses: 0, avgConfidence: 0 } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get("/v1/export", async (req, res) => {
  try {
    const { type = "usage", format = "csv" } = req.query;

    if (format === "csv") {
      const stats = await adminService.getAnalyticsDashboard(req.user.organizationId || null);
      const rows = [];
      let header = "Metric,Value\n";

      if (type === "usage" || type === "all") {
        rows.push(`Total Chats,${stats?.totalChats || 0}`);
        rows.push(`Total Tickets,${stats?.totalTickets || 0}`);
        rows.push(`Total Users,${stats?.totalUsers || 0}`);
        rows.push(`Total Documents,${stats?.totalDocuments || 0}`);
      }

      const csv = header + rows.join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=analytics-report.csv");
      return res.status(200).send(csv);
    }

    res.status(400).json({ success: false, message: "Unsupported format" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
