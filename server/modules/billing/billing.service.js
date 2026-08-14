import Organization from "../organization/organization.schema.js";
import Invoice from "./invoice.schema.js";
import * as auditLogService from "../audit-log/auditLog.service.js";

/**
 * Plan entitlements — single source of truth for what each plan includes.
 * All limits are enforced server-side (never in React).
 *
 * storage_limit is in bytes; ai_requests_month is the monthly AI request
 * allowance; price_usd is the list price per month.
 */
export const PLAN_LIMITS = {
  free: { storage_limit: 524288000, ai_requests_limit: 1000, price_usd: 0 },
  starter: { storage_limit: 5 * 1024 ** 3, ai_requests_limit: 10000, price_usd: 49 },
  business: { storage_limit: 50 * 1024 ** 3, ai_requests_limit: 100000, price_usd: 149 },
  enterprise: { storage_limit: 500 * 1024 ** 3, ai_requests_limit: 1000000, price_usd: 499 },
};

export const PLANS = ["free", "starter", "business", "enterprise"];

export const getPlanLimits = (plan = "free") => PLAN_LIMITS[plan] || PLAN_LIMITS.free;

const nextPeriod = () => {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { period_start: start, period_end: end };
};

/**
 * Billing summary for an organization: plan, entitlements, current usage,
 * subscription window, and the most recent invoices.
 */
export const getBillingSummary = async (orgId) => {
  const org = await Organization.findById(orgId)
    .select(
      "name plan storage_used storage_limit ai_requests_month ai_requests_limit ai_requests_reset_at subscription_start subscription_end"
    )
    .lean();
  if (!org) throw new Error("Organization not found");

  const limits = getPlanLimits(org.plan);

  const [invoices, invoiceCount] = await Promise.all([
    Invoice.find({ organization_id: orgId }).sort({ created_at: -1 }).limit(10).lean(),
    Invoice.countDocuments({ organization_id: orgId }),
  ]);

  return {
    plan: org.plan,
    plan_limits: limits,
    storage_used: org.storage_used || 0,
    storage_limit: org.storage_limit || limits.storage_limit,
    ai_requests_month: org.ai_requests_month || 0,
    ai_requests_limit: org.ai_requests_limit || limits.ai_requests_limit,
    ai_requests_reset_at: org.ai_requests_reset_at || null,
    subscription_start: org.subscription_start || null,
    subscription_end: org.subscription_end || null,
    storage_percent: Math.min(100, Math.round(((org.storage_used || 0) / (org.storage_limit || limits.storage_limit)) * 100)),
    ai_usage_percent: Math.min(100, Math.round(((org.ai_requests_month || 0) / (org.ai_requests_limit || limits.ai_requests_limit)) * 100)),
    invoices,
    invoice_count: invoiceCount,
  };
};

export const listInvoices = async (orgId, { page = 1, limit = 20 } = {}) => {
  const total = await Invoice.countDocuments({ organization_id: orgId });
  const invoices = await Invoice.find({ organization_id: orgId })
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
  return {
    data: invoices,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

/**
 * Change an organization's plan. Validates the target plan, applies the new
 * entitlements + subscription window, records an invoice, and writes an audit
 * entry. Only `admin` (or higher) may call this — enforced at the route.
 */
export const changePlan = async ({ orgId, newPlan, adminUser, reqMeta = {} }) => {
  if (!PLANS.includes(newPlan)) throw new Error("Invalid plan");
  if (newPlan === "free") throw new Error("Cannot downgrade to the free plan from an active subscription — contact support");

  const org = await Organization.findById(orgId);
  if (!org) throw new Error("Organization not found");

  const oldPlan = org.plan;
  const limits = getPlanLimits(newPlan);
  const { period_start, period_end } = nextPeriod();

  org.plan = newPlan;
  org.storage_limit = limits.storage_limit;
  org.ai_requests_limit = limits.ai_requests_limit;
  org.subscription_start = period_start;
  org.subscription_end = period_end;
  org.ai_requests_reset_at = new Date();
  await org.save();

  const invoiceNumber = `INV-${Date.now()}-${Math.floor(Math.random() * 900 + 100)}`;
  const invoice = await Invoice.create({
    organization_id: orgId,
    invoice_number: invoiceNumber,
    plan: newPlan,
    amount_usd: limits.price_usd,
    period_start,
    period_end,
    status: "paid",
    payment_method: "manual",
    created_by: adminUser,
    notes: `Plan changed from ${oldPlan} to ${newPlan}`,
    metadata: { previous_plan: oldPlan },
  });

  try {
    await auditLogService.logAction({
      user_id: adminUser,
      organization_id: orgId,
      action: "BILLING_PLAN_CHANGED",
      table_name: "organization",
      record_id: String(org._id),
      old_value: { plan: oldPlan },
      new_value: { plan: newPlan },
      ip_address: reqMeta.ip,
      user_agent: reqMeta.userAgent,
    });
  } catch (err) {
    console.error("[Billing] Audit log failed:", err.message);
  }

  return {
    plan: newPlan,
    storage_limit: limits.storage_limit,
    ai_requests_limit: limits.ai_requests_limit,
    subscription_start: period_start,
    subscription_end: period_end,
    invoice,
  };
};

export default {
  PLAN_LIMITS,
  PLANS,
  getPlanLimits,
  getBillingSummary,
  listInvoices,
  changePlan,
};