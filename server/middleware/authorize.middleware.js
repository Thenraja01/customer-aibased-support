// middleware/authorize.middleware.js
import User from '../modules/user/user.schema.js';

/**
 * Role-based authorization middleware
 * @param {...string} allowedRoles - List of roles allowed to access the route
 * @returns {Function} Express middleware
 */
export const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        console.error('❌ No user in request');
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get user with populated role
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
      
      console.log('🔐 Authorization Check:');
      console.log(`   User: ${populatedUser.email}`);
      console.log(`   User Role: ${userRole?.role_name || 'No role'}`);
      console.log(`   Allowed Roles: ${allowedRoles.join(', ')}`);
      
      // Check if user has a role
      if (!userRole) {
        console.error('❌ User has no role assigned');
        return res.status(403).json({
          success: false,
          message: 'No role assigned to user'
        });
      }

      // Check if user is active
      if (populatedUser.status !== 'active') {
        console.error('❌ User account is not active');
        return res.status(403).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Check if role is active
      if (userRole.status !== 'active') {
        console.error('❌ Role is not active');
        return res.status(403).json({
          success: false,
          message: 'Role is not active'
        });
      }

      // Case-insensitive role check
      const normalizedUserRole = userRole.role_name.toLowerCase().trim();
      const isAllowed = allowedRoles.some(role => 
        role.toLowerCase().trim() === normalizedUserRole
      );
      
      if (!isAllowed) {
        console.error(`❌ Access denied for role: ${userRole.role_name}`);
        return res.status(403).json({
          success: false,
          message: `Forbidden: Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole.role_name}`
        });
      }

      // Attach populated user to request for downstream use
      req.user = populatedUser;
      
      console.log('✅ Authorization successful');
      next();
    } catch (error) {
      console.error('❌ Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message
      });
    }
  };
};

/**
 * Permission-based authorization middleware
 * @param {...string} requiredPermissions - List of permissions required
 * @returns {Function} Express middleware
 */
export const requirePermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        console.error('❌ No user in request');
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get user with populated role
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
      
      console.log('🔐 Permission Check:');
      console.log(`   User: ${populatedUser.email}`);
      console.log(`   Role: ${userRole?.role_name || 'No role'}`);
      console.log(`   Required Permissions: ${requiredPermissions.join(', ')}`);
      
      if (!userRole) {
        console.error('❌ User has no role assigned');
        return res.status(403).json({
          success: false,
          message: 'No role assigned to user'
        });
      }

      // Super admin has all permissions (wildcard)
      if (userRole.permissions.includes('*')) {
        console.log('✅ Super admin with wildcard permissions');
        req.user = populatedUser;
        return next();
      }

      // Check if user has all required permissions
      const userPermissions = userRole.permissions || [];
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        console.error(`❌ Missing permissions. Required: ${requiredPermissions.join(', ')}`);
        console.log(`   User permissions: ${userPermissions.join(', ')}`);
        return res.status(403).json({
          success: false,
          message: `Forbidden: Missing required permissions. Required: ${requiredPermissions.join(', ')}`
        });
      }

      req.user = populatedUser;
      console.log('✅ Permission check successful');
      next();
    } catch (error) {
      console.error('❌ Permission error:', error);
      return res.status(500).json({
        success: false,
        message: 'Permission check failed',
        error: error.message
      });
    }
  };
};

/**
 * Combined role and permission authorization
 * @param {Object} options - Authorization options
 * @param {string[]} options.roles - Allowed roles
 * @param {string[]} options.permissions - Required permissions
 * @returns {Function} Express middleware
 */
export const authorizeWithPermissions = (options = {}) => {
  const { roles = [], permissions = [] } = options;
  
  return async (req, res, next) => {
    try {
      const user = req.user;
      
      if (!user) {
        console.error('❌ No user in request');
        return res.status(401).json({
          success: false,
          message: 'User not authenticated'
        });
      }

      // Get user with populated role
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
      
      console.log('🔐 Combined Authorization Check:');
      console.log(`   User: ${populatedUser.email}`);
      console.log(`   Role: ${userRole?.role_name || 'No role'}`);
      console.log(`   Required Roles: ${roles.join(', ')}`);
      console.log(`   Required Permissions: ${permissions.join(', ')}`);
      
      if (!userRole) {
        console.error('❌ User has no role assigned');
        return res.status(403).json({
          success: false,
          message: 'No role assigned to user'
        });
      }

      // Check if user is active
      if (populatedUser.status !== 'active') {
        console.error('❌ User account is not active');
        return res.status(403).json({
          success: false,
          message: 'Account is not active'
        });
      }

      // Role check
      if (roles.length > 0) {
        const normalizedUserRole = userRole.role_name.toLowerCase().trim();
        const hasAllowedRole = roles.some(role => 
          role.toLowerCase().trim() === normalizedUserRole
        );
        
        if (!hasAllowedRole) {
          console.error(`❌ Role access denied for: ${userRole.role_name}`);
          return res.status(403).json({
            success: false,
            message: `Forbidden: Required roles: ${roles.join(', ')}. Your role: ${userRole.role_name}`
          });
        }
      }

      // Permission check
      if (permissions.length > 0) {
        // Super admin has all permissions
        if (userRole.permissions.includes('*')) {
          console.log('✅ Super admin with wildcard permissions');
          req.user = populatedUser;
          return next();
        }

        const userPermissions = userRole.permissions || [];
        const hasAllPermissions = permissions.every(permission =>
          userPermissions.includes(permission)
        );

        if (!hasAllPermissions) {
          console.error(`❌ Missing permissions for: ${populatedUser.email}`);
          console.log(`   Required: ${permissions.join(', ')}`);
          console.log(`   User has: ${userPermissions.join(', ')}`);
          return res.status(403).json({
            success: false,
            message: `Forbidden: Missing required permissions`
          });
        }
      }

      req.user = populatedUser;
      console.log('✅ Combined authorization successful');
      next();
    } catch (error) {
      console.error('❌ Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message
      });
    }
  };
};

/**
 * Check if user owns the resource or is admin
 * @param {Function} getResourceOwnerId - Function to get owner ID from request
 * @returns {Function} Express middleware
 */
export const authorizeOwnerOrAdmin = (getResourceOwnerId) => {
  return async (req, res, next) => {
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

      // Check if user is admin
      const userRole = populatedUser.role_id;
      const isAdmin = ['super admin', 'tenant admin'].includes(
        userRole?.role_name?.toLowerCase()
      );

      if (isAdmin) {
        console.log('✅ Admin access granted');
        req.user = populatedUser;
        return next();
      }

      // Check if user owns the resource
      const ownerId = getResourceOwnerId(req);
      if (ownerId && ownerId.toString() === populatedUser._id.toString()) {
        console.log('✅ Resource owner access granted');
        req.user = populatedUser;
        return next();
      }

      console.error(`❌ Access denied: User is not admin or resource owner`);
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource'
      });
    } catch (error) {
      console.error('❌ Owner/Admin authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message
      });
    }
  };
};  