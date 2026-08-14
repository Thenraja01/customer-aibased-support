import * as billingService from "./billing.service.js";

const orgIdFrom = (req) => req.scope?.organizationId || req.user?.organizationId;

// GET /admin/v1/billing
export const getBilling = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const summary = await billingService.getBillingSummary(orgId);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    const status = error.message === "Organization not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// GET /admin/v1/billing/invoices
export const getInvoices = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const result = await billingService.listInvoices(orgId, { page, limit });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /admin/v1/billing/change-plan
export const changePlan = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    if (!orgId) {
      return res.status(400).json({ success: false, message: "Organization ID is required" });
    }
    const { plan } = req.body;
    if (!plan) {
      return res.status(400).json({ success: false, message: "plan is required" });
    }
    const result = await billingService.changePlan({
      orgId,
      newPlan: plan,
      adminUser: req.user?.userId || req.user?._id,
      reqMeta: { ip: req.ip, userAgent: req.headers["user-agent"] },
    });
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    const status = error.message === "Invalid plan" || error.message === "Cannot downgrade to the free plan from an active subscription — contact support" ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export default {
  getBilling,
  getInvoices,
  changePlan,
};