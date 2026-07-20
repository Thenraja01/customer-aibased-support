import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGateProps {
  permission?: string;
  feature?: string;
  permissions?: string[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * PermissionGate Component
 * 
 * Conditionally renders children based on user permissions and features.
 * This is the frontend-side permission guard that works with the backend-driven UI config.
 * 
 * Usage examples:
 * 
 * <Can permission="can_verify_documents">
 *   <Button onClick={handleVerify}>Verify Document</Button>
 * </Can>
 * 
 * <Can feature="analytics_enabled">
 *   <AnalyticsDashboard />
 * </Can>
 * 
 * <Can permissions={["can_manage_users", "can_view_analytics"]} requireAll={true}>
 *   <UserManagementWithAnalytics />
 * </Can>
 */
export function PermissionGate({
  permission,
  feature,
  permissions,
  requireAll = false,
  children,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasFeature } = usePermissions();

  // Check single permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check single feature
  if (feature && !hasFeature(feature)) {
    return <>{fallback}</>;
  }

  // Check multiple permissions
  if (permissions && permissions.length > 0) {
    const hasPermissionAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
    
    if (!hasPermissionAccess) {
      return <>{fallback}</>;
    }
  }

  return <>{children}</>;
}

// Alias for shorter syntax
export const Can = PermissionGate;

export default PermissionGate;
