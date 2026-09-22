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

  // 3. From subdomain (for unauthenticated public pages or widget)
  if (!organizationId) {
    const rawHost = req.get("host") || "";
    const host = rawHost.split(":")[0]; // strip port e.g. 5173 or 3030
    const hostParts = host.split(".");
    
    let possibleTenantSubdomain = null;
    let possibleBranchSubdomain = null;

    if (host.endsWith(".localhost")) {
      if (hostParts.length === 2) {
        possibleTenantSubdomain = hostParts[0];
      } else if (hostParts.length >= 3) {
        possibleBranchSubdomain = hostParts[0];
        possibleTenantSubdomain = hostParts[1];
      }
    } else if (hostParts.length >= 3 && hostParts[0] !== "localhost" && hostParts[0] !== "www") {
      possibleTenantSubdomain = hostParts[0];
      if (hostParts.length >= 4) {
        possibleBranchSubdomain = hostParts[0];
        possibleTenantSubdomain = hostParts[1];
      }
    }

    if (possibleTenantSubdomain) {
      try {
        let org = await Organization.findOne({
          $or: [
            { subdomain: possibleTenantSubdomain.toLowerCase() },
            { domain: possibleTenantSubdomain.toLowerCase() },
            { organization_id: possibleTenantSubdomain.toUpperCase() }
          ]
        }).select("_id status").lean();

        if (!org && possibleBranchSubdomain) {
          // Retry if first part was tenant
          org = await Organization.findOne({
            $or: [
              { subdomain: possibleBranchSubdomain.toLowerCase() },
              { domain: possibleBranchSubdomain.toLowerCase() },
              { organization_id: possibleBranchSubdomain.toUpperCase() }
            ]
          }).select("_id status").lean();
          if (org) {
            possibleTenantSubdomain = possibleBranchSubdomain;
            possibleBranchSubdomain = null;
          }
        }

        if (org && org.status === "active") {
          organizationId = org._id.toString();

          if (possibleBranchSubdomain) {
            const { default: Branch } = await import("../modules/branch/branch.schema.js");
            const branch = await Branch.findOne({
              organization_id: organizationId,
              $or: [
                { subdomain: possibleBranchSubdomain.toLowerCase() },
                { code: possibleBranchSubdomain.toUpperCase() }
              ]
            }).select("_id status").lean();
            if (branch && branch.status === "active") {
              branchId = branch._id.toString();
            }
          }
        }
      } catch (error) {
        console.error("Subdomain resolution error:", error);
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
