// middleware/authorize.middleware.js
import { normalizeRoleName, isNormalizedAdminRole } from "../utils/constants.js";
import User from '../modules/user/user.schema.js';

/**
 * Check if user is an admin (super admin, tenant admin, or admin)
 * @param {Object} req - Express request object
 * @returns {boolean} True if user is an admin
 */
export const isAdminUser = (req) => {
  const user = req.user;
  if (!user) return false;

  const roleName = typeof user.role_id === 'object'
    ? user.role_id?.role_name
    : user.role_id;

  return isNormalizedAdminRole(normalizeRoleName(roleName));
};

/**
 * Tenant isolation middleware - ensures users can only access their organization's data
 */
export const tenantIsolation = async (req, res, next) => {
  try {
    const user = req.user;
    
    if (!user) {
      console.error('❌ No user in request');
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    const populatedUser = await User.findById(user._id)
      .populate('role_id')
      .lean();

    if (!populatedUser) {
      console.error('❌ User not found in database');
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    const userRole = populatedUser.role_id;
    
    // Super admins can access all organizations
    const normalizedUserRole = normalizeRoleName(userRole?.role_name);
    if (userRole && isNormalizedAdminRole(normalizedUserRole)) {
      console.log('✅ Super admin bypassing tenant isolation');
      req.user = populatedUser;
      return next();
    }

    // For other users, ensure they have an organization
    if (!populatedUser.organization_id) {
      console.error('❌ User has no organization');
      return res.status(403).json({
        success: false,
        message: 'User has no organization assigned'
      });
    }

    req.user = populatedUser;
    console.log('✅ Tenant isolation check passed');
    next();
  } catch (error) {
    console.error('❌ Tenant isolation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Tenant isolation failed',
      error: error.message
    });
  }
};
