// middleware/tenant.middleware.js
//
// Multi-tenant context resolution.
// Resolves both organizationId and branchId from the authenticated user,
// request headers, or subdomain.

import Organization from "../modules/organization/organization.schema.js";

export const identifyTenant = async (req, res, next) => {
  let organizationId = null;
  let organization = null;
  let branchId = null;

  // 1. From authenticated user (most authoritative)
  if (req.user && !req.user.isAnonymous) {
    organizationId = req.user.organizationId;
    branchId = req.user.branchId || null;
  }

  // 2. From tenant headers (for API consumers)
  if (!organizationId) {
    const tenantHeader = req.headers["x-tenant-id"] || req.headers["x-organization-id"];
    if (tenantHeader) {
      organizationId = tenantHeader;
    }
  }

  // Branch header (only trusted when already authenticated)
  if (!branchId) {
    const branchHeader = req.headers["x-branch-id"];
    if (branchHeader && req.user) {
      branchId = branchHeader;
    }
  }

  // 3. From subdomain
  if (!organizationId) {
    const host = req.get("host") || "";
    const subdomain = host.split(".")[0];
    if (subdomain && subdomain !== "localhost" && subdomain.length > 2) {
      try {
        const org = await Organization.findOne({ domain: subdomain }).select("_id").lean();
        if (org) {
          organizationId = org._id;
        }
      } catch {
        // Continue without org
      }
    }
  }

  // 4. Fallback to default org
  if (!organizationId) {
    const publicOrgId = process.env.DEFAULT_ORGANIZATION_ID;
    if (publicOrgId) {
      organizationId = publicOrgId;
    }
  }

  // Validate organization exists and is active
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

  req.organizationId = organizationId || req.organizationId || req.user?.organizationId;
  req.organization = organization || req.organization;
  req.branchId = branchId || req.branchId || req.user?.branchId || null;

  next();
};

export default { identifyTenant };
