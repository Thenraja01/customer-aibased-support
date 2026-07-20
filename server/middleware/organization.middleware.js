import Organization from "../modules/organization/organization.schema.js";
import ApiError from "../utils/ApiError.js";

/**
 * Attach organization configuration to request
 * Loads org config from database (can be enhanced with Redis caching)
 */
export const attachOrganization = async (req, res, next) => {
  try {
    if (!req.user || !req.user.organizationId) {
      throw new ApiError(400, "User must belong to an organization");
    }

    const organization = await Organization.findOne({
      _id: req.user.organizationId,
      is_deleted: { $ne: true },
    });

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    if (organization.status === "suspended") {
      throw new ApiError(403, "Organization is suspended");
    }

    if (organization.status === "inactive") {
      throw new ApiError(403, "Organization is inactive");
    }

    req.organization = organization;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Enforce that user belongs to the organization they're trying to access
 */
export const enforceOrgScope = (req, res, next) => {
  try {
    if (!req.user || !req.organization) {
      throw new ApiError(401, "Unauthorized");
    }

    if (req.user.organizationId.toString() !== req.organization._id.toString()) {
      throw new ApiError(403, "Access denied: organization scope violation");
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Check if a specific feature is enabled for the organization
 */
export const checkFeatureFlag = (feature) => {
  return (req, res, next) => {
    try {
      if (!req.organization) {
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

/**
 * Check if organization is active (not suspended or inactive)
 */
export const enforceOrgActive = (req, res, next) => {
  try {
    if (!req.organization) {
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

/**
 * Check organization limits (e.g., max users, max uploads)
 */
export const checkOrgLimit = (limitType) => {
  return async (req, res, next) => {
    try {
      if (!req.organization) {
        throw new ApiError(401, "Organization not attached to request");
      }

      const limits = req.organization.limits || {};
      const limit = limits[limitType];

      if (limit === undefined) {
        // No limit set, allow
        return next();
      }

      // Check current usage against limit
      // This would need to be implemented based on the specific limit type
      // For now, we'll pass through and let specific controllers handle limit checking
      req.limitCheck = { type: limitType, limit };
      next();
    } catch (error) {
      next(error);
    }
  };
};
