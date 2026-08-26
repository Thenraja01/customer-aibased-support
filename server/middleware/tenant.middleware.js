// middleware/tenant.middleware.js
//
// Multi-tenant context resolution.
// Resolves organizationId and branchId securely.
// Rules:
// 1. Authenticated user's organizationId is AUTHORITATIVE (cannot be overridden by headers/subdomain).
// 2. Unauthenticated calls resolve tenant via header or subdomain for public knowledge lookup.

import Organization from "../modules/organization/organization.schema.js";

export const identifyTenant = async (req, res, next) => {
  let organizationId = null;
  let organization = null;
  let branchId = null;

  // 1. From authenticated user (authoritative)
  if (req.user && !req.user.isAnonymous) {
    organizationId = req.user.organizationId || req.user.organization_id;
    branchId = req.user.branchId || req.user.branch_id || null;
  }

  // 2. From tenant headers (ONLY for unauthenticated public routes or API consumers without user session)
  if (!organizationId) {
    const tenantHeader = req.headers["x-tenant-id"] || req.headers["x-organization-id"];
    if (tenantHeader) {
      organizationId = tenantHeader;
    }
  }

  if (!branchId) {
    const branchHeader = req.headers["x-branch-id"];
    if (branchHeader) {
      branchId = branchHeader;
    }
  }

  // 3. From subdomain (for unauthenticated public pages)
  if (!organizationId) {
    const host = req.get("host") || "";
    const subdomain = host.split(".")[0];
    if (subdomain && subdomain !== "localhost" && subdomain.length > 2) {
      try {
        const org = await Organization.findOne({ domain: subdomain }).select("_id status").lean();
        if (org && org.status === "active") {
          organizationId = org._id.toString();
        }
      } catch {
        /* continue */
      }
    }
  }

  // 4. Validate organization status if organizationId is present
  if (organizationId) {
    try {
      organization = await Organization.findById(organizationId).lean();
      if (organization && organization.status !== "active") {
        organization = null;
        organizationId = null;
      }
    } catch {
      organization = null;
    }
  }

  req.organizationId = organizationId || req.user?.organizationId || null;
  req.organization = organization || null;
  req.branchId = branchId || req.user?.branchId || null;

  next();
};

export default { identifyTenant };
