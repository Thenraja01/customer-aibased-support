import Organization from "../modules/organization/organization.schema.js";
import ApiError from "../utils/ApiError.js";
import { normalizeRoleName } from "./auth.middleware.js";

const resolveOrgId = (req) => {
  return req.headers["x-organization-id"] || req.headers["x-org-id"] || req.user?.organizationId || req.user?.organization_id || null;
};

export const attachOrganization = async (req, res, next) => {
  try {
    const roleName = normalizeRoleName(req.user?.roleName);
    const organizationId = resolveOrgId(req);

    if (!organizationId) {
      if (roleName === "super_admin") {
        req.organization = null;
        return next();
      }
      throw new ApiError(400, "Organization context is required");
    }

    const organization = await Organization.findOne({
      $or: [{ _id: organizationId }, { organization_id: organizationId }, { slug: organizationId }],
      is_deleted: { $ne: true },
    });

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    if (["suspended", "inactive"].includes(organization.status)) {
      throw new ApiError(403, `Organization is ${organization.status}`);
    }

    req.organization = organization;
    next();
  } catch (error) {
    next(error);
  }
};

export const enforceOrgScope = (req, res, next) => {
  try {
    const roleName = normalizeRoleName(req.user?.roleName);

    if (roleName === "super_admin" && !req.organization) {
      return next();
    }

    if (!req.user || !req.organization) {
      throw new ApiError(401, "Unauthorized");
    }

    const userOrg = String(req.user.organizationId || req.user.organization_id || "");
    const orgId = String(req.organization._id);

    if (userOrg && userOrg !== orgId) {
      throw new ApiError(403, "Access denied: organization scope violation");
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkFeatureFlag = (feature) => {
  return (req, res, next) => {
    try {
      if (!req.organization) {
        if (normalizeRoleName(req.user?.roleName) === "super_admin") {
          return next();
        }
        throw new ApiError(401, "Organization not attached to request");
      }

      if (!req.organization.features || req.organization.features[feature] !== true) {
        throw new ApiError(403, `Feature '${feature}' is not enabled for your organization`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const enforceOrgActive = (req, res, next) => {
  try {
    if (!req.organization) {
      if (normalizeRoleName(req.user?.roleName) === "super_admin") {
        return next();
      }
      throw new ApiError(401, "Organization not attached to request");
    }

    if (req.organization.status !== "active") {
      throw new ApiError(403, `Organization is ${req.organization.status}`);
    }

    next();
  } catch (error) {
    next(error);
  }
};

export const checkOrgLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      if (!req.organization) {
        if (normalizeRoleName(req.user?.roleName) === "super_admin") {
          return next();
        }
        throw new ApiError(401, "Organization not attached to request");
      }

      const limits = req.organization.limits || {};
      const limit = limits[limitType];

      if (limit === undefined) {
        return next();
      }

      req.limitCheck = { type: limitType, limit };
      next();
    } catch (error) {
      next(error);
    }
  };
};
