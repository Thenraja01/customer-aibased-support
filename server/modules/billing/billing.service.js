import Organization from "../organization/organization.schema.js";
import Invoice from "./invoice.schema.js";
import PlatformPlan from "./platformPlan.schema.js";
import * as auditLogService from "../audit-log/auditLog.service.js";

export const DEFAULT_PLAN_LIMITS = {
  free: {
    plan_key: "free",
    name: "Free",
    price_usd: 0,
    storage_limit_bytes: 524288000,
    ai_requests_limit: 1000,
    blurb: "1k AI requests / mo • 500 MB Storage",
    features: ["1,000 AI Chat Requests", "500 MB Document Storage", "Standard Knowledge Graph", "Community Support"],
    badge: "Basic",
    is_active: true,
    is_default: true,
    sort_order: 1,
  },
  starter: {
    plan_key: "starter",
    name: "Starter",
    price_usd: 49,
    storage_limit_bytes: 5 * 1024 ** 3,
    ai_requests_limit: 10000,
    blurb: "10k AI requests / mo • 5 GB Storage",
    features: ["10,000 AI Chat Requests", "5 GB Document Storage", "Multi-Branch Support", "Email Notifications", "Standard SLA"],
    badge: "Popular",
    is_active: true,
    sort_order: 2,
  },
  business: {
    plan_key: "business",
    name: "Business",
    price_usd: 149,
    storage_limit_bytes: 50 * 1024 ** 3,
    ai_requests_limit: 100000,
    blurb: "100k AI requests / mo • 50 GB Storage",
    features: ["100,000 AI Chat Requests", "50 GB Document Storage", "AI Routing & Intelligence", "Custom Guardrails", "Priority 24/7 SLA"],
    badge: "Growth",
    is_active: true,
    sort_order: 3,
  },
  enterprise: {
    plan_key: "enterprise",
    name: "Enterprise",
    price_usd: 499,
    storage_limit_bytes: 500 * 1024 ** 3,
    ai_requests_limit: 1000000,
    blurb: "1M AI requests / mo • 500 GB Storage",
    features: ["1,000,000 AI Chat Requests", "500 GB Document Storage", "Dedicated LLM Routing", "Audit Compliance Log Vault", "Dedicated Account Engineer"],
    badge: "Scale",
    is_active: true,
    sort_order: 4,
  },
};
let _plansCache = null;
let _lastCacheFetch = 0;
const CACHE_TTL = 60 * 1000;

export const seedDefaultPlansIfEmpty = async () => {
  try {
    const count = await PlatformPlan.countDocuments();
    if (count === 0) {
      const defaults = Object.values(DEFAULT_PLAN_LIMITS);
      await PlatformPlan.insertMany(defaults);
      console.log("[Billing] Seeded default platform billing plans into database");
    }
  } catch (err) {
    console.error("[Billing] Failed to seed default platform plans:", err.message);
  }
};

export const getAllPlatformPlans = async (includeInactive = false) => {
  await seedDefaultPlansIfEmpty();
  const query = includeInactive ? {} : { is_active: true };
  const plans = await PlatformPlan.find(query).sort({ sort_order: 1, price_usd: 1 }).lean();

  if (!plans || plans.length === 0) {
    return Object.values(DEFAULT_PLAN_LIMITS);
  }

  return plans;
};

export const getPlanLimits = async (plan = "free") => {
  const normalized = (plan || "free").toLowerCase().trim();
  const now = Date.now();

  if (!_plansCache || now - _lastCacheFetch > CACHE_TTL) {
    try {
      const dbPlans = await PlatformPlan.find({ is_active: true }).lean();
      if (dbPlans && dbPlans.length > 0) {
        _plansCache = {};
        dbPlans.forEach((p) => {
          _plansCache[p.plan_key] = {
            storage_limit: p.storage_limit_bytes,
            ai_requests_limit: p.ai_requests_limit,
            price_usd: p.price_usd,
            name: p.name,
            blurb: p.blurb,
            features: p.features,
            badge: p.badge,
          };
        });
        _lastCacheFetch = now;
      }
    } catch {
      /* fallback to memory */
    }
  }

  if (_plansCache && _plansCache[normalized]) {
    return _plansCache[normalized];
  }

  const def = DEFAULT_PLAN_LIMITS[normalized] || DEFAULT_PLAN_LIMITS.free;
  return {
    storage_limit: def.storage_limit_bytes,
    ai_requests_limit: def.ai_requests_limit,
    price_usd: def.price_usd,
    name: def.name,
    blurb: def.blurb,
    features: def.features,
    badge: def.badge,
  };
};

/**
 * SuperAdmin: Create or update custom plan configuration
 */
export const savePlatformPlan = async (planData, adminUserId) => {
  const { plan_key, name, price_usd, storage_limit_bytes, storage_limit_mb, ai_requests_limit, blurb, features, badge, is_active, sort_order } = planData;
  if (!plan_key) throw new Error("plan_key is required");

  const normalizedKey = plan_key.toLowerCase().trim();
  const bytes = storage_limit_bytes || (storage_limit_mb ? storage_limit_mb * 1024 * 1024 : 524288000);

  const payload = {
    plan_key: normalizedKey,
    name: name || normalizedKey.charAt(0).toUpperCase() + normalizedKey.slice(1),
    price_usd: Number(price_usd) >= 0 ? Number(price_usd) : 0,
    storage_limit_bytes: bytes,
    ai_requests_limit: Number(ai_requests_limit) || 1000,
    blurb: blurb || "",
    features: Array.isArray(features) ? features : [],
    badge: badge || "",
    is_active: is_active !== undefined ? Boolean(is_active) : true,
    sort_order: Number(sort_order) || 0,
  };

  const existing = await PlatformPlan.findOne({ plan_key: normalizedKey });
  let saved;

  if (existing) {
    saved = await PlatformPlan.findOneAndUpdate({ plan_key: normalizedKey }, { $set: payload }, { new: true });
  } else {
    saved = await PlatformPlan.create(payload);
  }

  _plansCache = null; // Invalidate cache

  if (adminUserId) {
    try {
      await auditLogService.logAction({
        user_id: adminUserId,
        action: "PLATFORM_PLAN_CONFIGURED",
        table_name: "platform_plan",
        record_id: String(saved._id),
        old_value: existing ? existing.toObject() : null,
        new_value: saved.toObject(),
      });
    } catch {
      /* ignore */
    }
  }

  return saved;
};

/**
 * SuperAdmin: Delete custom plan
 */
export const deletePlatformPlan = async (planKey, adminUserId) => {
  const normalized = planKey.toLowerCase().trim();
  if (["free", "starter", "business", "enterprise"].includes(normalized)) {
    throw new Error("Core system plans cannot be deleted. You can edit their limits or mark them inactive.");
  }

  const res = await PlatformPlan.findOneAndDelete({ plan_key: normalized });
  _plansCache = null;
  return res;
};

const nextPeriod = () => {
  const start = new Date();
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  return { period_start: start, period_end: end };
};

/**
 * Monthly Quota Auto-Reset Check
 */
export const checkAndResetMonthlyQuota = async (orgId) => {
  if (!orgId) return;
  try {
    const org = await Organization.findById(orgId).select("ai_requests_reset_at ai_requests_month plan").lean();
    if (!org) return;

    const now = new Date();
    const lastReset = org.ai_requests_reset_at ? new Date(org.ai_requests_reset_at) : null;

    if (!lastReset || (now.getTime() - lastReset.getTime()) > (30 * 24 * 60 * 60 * 1000)) {
      await Organization.updateOne(
        { _id: orgId },
        {
          $set: {
            ai_requests_month: 0,
            ai_requests_reset_at: now,
          },
        }
      );
    }
  } catch (err) {
    console.error("[BillingQuota] Auto-reset check failed:", err.message);
  }
};

/**
 * Billing summary for an organization: plan, entitlements, current usage,
 * subscription window, and the most recent invoices.
 */
export const getBillingSummary = async (orgId) => {
  await checkAndResetMonthlyQuota(orgId);

  const org = await Organization.findById(orgId)
    .select(
      "name plan storage_used storage_limit ai_requests_month ai_requests_limit ai_requests_reset_at subscription_start subscription_end"
    )
    .lean();
  if (!org) throw new Error("Organization not found");

  const limits = await getPlanLimits(org.plan);
  const allPlans = await getAllPlatformPlans();

  const [invoices, invoiceCount] = await Promise.all([
    Invoice.find({ organization_id: orgId }).sort({ created_at: -1 }).limit(10).lean(),
    Invoice.countDocuments({ organization_id: orgId }),
  ]);

  return {
    plan: org.plan || "free",
    plan_limits: limits,
    available_plans: allPlans,
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

export const getInvoiceById = async (invoiceId, orgId = null) => {
  const query = { _id: invoiceId };
  if (orgId) query.organization_id = orgId;
  const invoice = await Invoice.findOne(query).populate("organization_id", "name email domain").lean();
  if (!invoice) throw new Error("Invoice not found");
  return invoice;
};

export const generateInvoiceHtml = async (invoiceId, orgId = null) => {
  const invoice = await getInvoiceById(invoiceId, orgId);
  const orgName = invoice.organization_id?.name || "SupportAI Customer";
  const orgEmail = invoice.organization_id?.email || "";
  const periodStart = invoice.period_start ? new Date(invoice.period_start).toLocaleDateString() : "N/A";
  const periodEnd = invoice.period_end ? new Date(invoice.period_end).toLocaleDateString() : "N/A";
  const datePaid = invoice.created_at ? new Date(invoice.created_at).toLocaleDateString() : new Date().toLocaleDateString();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoice_number}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b; margin: 0; padding: 40px; background: #fff; }
    .invoice-card { max-width: 750px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 36px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #f1f5f9; padding-bottom: 24px; margin-bottom: 24px; }
    .brand { font-size: 24px; font-weight: 800; color: #0284c7; letter-spacing: -0.5px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; }
    .badge-paid { background: #dcfce7; color: #166534; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 32px; font-size: 14px; }
    .meta-col h4 { margin: 0 0 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .meta-col p { margin: 0; color: #0f172a; font-weight: 500; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
    th { text-align: left; background: #f8fafc; padding: 12px 16px; font-size: 13px; font-weight: 600; color: #475569; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    td { padding: 14px 16px; font-size: 14px; border-bottom: 1px solid #f1f5f9; color: #334155; }
    .total-section { display: flex; justify-content: flex-end; border-top: 2px solid #0f172a; padding-top: 16px; }
    .total-row { display: flex; justify-content: space-between; width: 260px; font-size: 16px; font-weight: 700; color: #0f172a; }
    .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
    @media print { body { padding: 0; } .invoice-card { border: none; box-shadow: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="invoice-card">
    <div class="header">
      <div>
        <div class="brand">SupportAI Cloud</div>
        <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">AI-Powered Customer Support Platform</p>
      </div>
      <div style="text-align: right;">
        <span class="badge badge-paid">${invoice.status}</span>
        <div style="font-size: 18px; font-weight: 700; margin-top: 8px;">${invoice.invoice_number}</div>
      </div>
    </div>

    <div class="meta-grid">
      <div class="meta-col">
        <h4>Billed To</h4>
        <p style="font-size: 16px; font-weight: 700;">${orgName}</p>
        <p style="color: #64748b;">${orgEmail}</p>
      </div>
      <div class="meta-col" style="text-align: right;">
        <h4>Invoice Details</h4>
        <p>Date Issued: <strong>${datePaid}</strong></p>
        <p>Billing Period: <strong>${periodStart} – ${periodEnd}</strong></p>
        <p>Payment Method: <strong>${invoice.payment_method || "Manual / Card"}</strong></p>
      </div>
    </div>

    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Plan Tier</th>
          <th>Billing Term</th>
          <th style="text-align: right;">Amount (USD)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>SupportAI ${invoice.plan.toUpperCase()} Subscription</strong>
            <div style="font-size: 12px; color: #64748b; margin-top: 2px;">Monthly quota allocation and team seat access</div>
          </td>
          <td><span style="text-transform: capitalize;">${invoice.plan}</span></td>
          <td>Monthly</td>
          <td style="text-align: right; font-weight: 600;">$${Number(invoice.amount_usd || 0).toFixed(2)}</td>
        </tr>
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span>Total Paid:</span>
        <span>$${Number(invoice.amount_usd || 0).toFixed(2)} USD</span>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing SupportAI. If you have billing inquiries, contact us at billing@supportai.io.</p>
      <p>SupportAI Inc. • 100 AI Boulevard • San Francisco, CA 94107</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

export const changePlan = async ({ orgId, newPlan, adminUser, reqMeta = {} }) => {
  const limits = await getPlanLimits(newPlan);
  if (!limits) throw new Error("Invalid plan selected");

  const org = await Organization.findById(orgId);
  if (!org) throw new Error("Organization not found");

  const oldPlan = org.plan;
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

export const getSuperAdminBillingOverview = async () => {
  await seedDefaultPlansIfEmpty();

  const [orgs, plans] = await Promise.all([
    Organization.find({ status: "active" }).select("plan storage_used ai_requests_month name created_at").lean(),
    getAllPlatformPlans(true),
  ]);

  const planBreakdown = {};
  plans.forEach((p) => {
    planBreakdown[p.plan_key] = 0;
  });

  let mrr = 0;
  orgs.forEach((o) => {
    const pKey = (o.plan || "free").toLowerCase();
    if (planBreakdown[pKey] !== undefined) {
      planBreakdown[pKey] += 1;
    }
    const matchedPlan = plans.find((p) => p.plan_key === pKey);
    mrr += (matchedPlan?.price_usd || 0);
  });

  const totalInvoices = await Invoice.countDocuments();
  const recentInvoices = await Invoice.find()
    .sort({ created_at: -1 })
    .limit(10)
    .populate("organization_id", "name email")
    .lean();

  return {
    mrr,
    arr: mrr * 12,
    activeSubscribers: orgs.filter((o) => (o.plan || "free") !== "free").length,
    totalOrganizations: orgs.length,
    planBreakdown,
    plans,
    totalInvoices,
    recentInvoices,
  };
};

export const listAllPlatformInvoices = async ({ page = 1, limit = 20, plan, status } = {}) => {
  const query = {};
  if (plan) query.plan = plan;
  if (status) query.status = status;

  const total = await Invoice.countDocuments(query);
  const invoices = await Invoice.find(query)
    .sort({ created_at: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate("organization_id", "name email")
    .lean();

  return {
    data: invoices,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  };
};

export default {
  DEFAULT_PLAN_LIMITS,
  seedDefaultPlansIfEmpty,
  getAllPlatformPlans,
  getPlanLimits,
  savePlatformPlan,
  deletePlatformPlan,
  getBillingSummary,
  listInvoices,
  getInvoiceById,
  generateInvoiceHtml,
  changePlan,
  checkAndResetMonthlyQuota,
  getSuperAdminBillingOverview,
  listAllPlatformInvoices,
};