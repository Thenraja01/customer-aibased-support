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

// GET /admin/v1/billing/invoices/:id/download
export const downloadInvoice = async (req, res) => {
  try {
    const orgId = orgIdFrom(req);
    const { id } = req.params;
    const isSuperAdmin = (req.user?.roleName || req.user?.role || "").toLowerCase() === "super_admin";
    
    const invoice = await billingService.getInvoiceById(id, isSuperAdmin ? null : orgId);
    const html = await billingService.generateInvoiceHtml(id, isSuperAdmin ? null : orgId);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Content-Disposition", `inline; filename="${invoice.invoice_number}.html"`);
    return res.status(200).send(html);
  } catch (error) {
    const status = error.message === "Invoice not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
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
    const status = error.message.includes("Invalid plan") ? 400 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

// GET /admin/v1/superadmin/billing/overview
export const getSuperAdminBillingOverview = async (req, res) => {
  try {
    const overview = await billingService.getSuperAdminBillingOverview();
    res.status(200).json({ success: true, data: overview });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/v1/superadmin/billing/invoices
export const getSuperAdminInvoices = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const { plan, status } = req.query;

    const result = await billingService.listAllPlatformInvoices({ page, limit, plan, status });
    res.status(200).json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /admin/v1/superadmin/billing/plans
export const getPlatformPlans = async (req, res) => {
  try {
    const plans = await billingService.getAllPlatformPlans(true);
    res.status(200).json({ success: true, data: plans });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /admin/v1/superadmin/billing/plans
export const savePlatformPlan = async (req, res) => {
  try {
    const adminUserId = req.user?.userId || req.user?._id;
    const plan = await billingService.savePlatformPlan(req.body, adminUserId);
    res.status(200).json({ success: true, data: plan });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /admin/v1/superadmin/billing/plans/:planKey
export const deletePlatformPlan = async (req, res) => {
  try {
    const adminUserId = req.user?.userId || req.user?._id;
    const { planKey } = req.params;
    await billingService.deletePlatformPlan(planKey, adminUserId);
    res.status(200).json({ success: true, message: `Plan ${planKey} deleted` });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export default {
  getBilling,
  getInvoices,
  downloadInvoice,
  changePlan,
  getSuperAdminBillingOverview,
  getSuperAdminInvoices,
  getPlatformPlans,
  savePlatformPlan,
  deletePlatformPlan,
};