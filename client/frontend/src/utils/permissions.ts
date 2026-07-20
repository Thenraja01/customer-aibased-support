import { PERMISSIONS, ROLE_PERMISSIONS } from '@/lib/rbac';

export function hasPermission(roleName: string, permission: string): boolean {
  return ROLE_PERMISSIONS[roleName]?.includes(permission) ?? false;
}

export function hasAnyPermission(roleName: string, permissions: string[]): boolean {
  return permissions.some((p) => hasPermission(roleName, p));
}

export function hasAllPermissions(roleName: string, permissions: string[]): boolean {
  return permissions.every((p) => hasPermission(roleName, p));
}

export function canManageUsers(roleName: string): boolean {
  return hasPermission(roleName, PERMISSIONS.MANAGE_USERS);
}

export function canManageDocuments(roleName: string): boolean {
  return hasPermission(roleName, PERMISSIONS.MANAGE_DOCUMENTS);
}

export function canVerifyDocuments(roleName: string): boolean {
  return hasPermission(roleName, PERMISSIONS.VERIFY_DOCUMENTS);
}

export function canViewAnalytics(roleName: string): boolean {
  return hasPermission(roleName, PERMISSIONS.VIEW_ANALYTICS);
}

export function canManageFAQs(roleName: string): boolean {
  return hasPermission(roleName, PERMISSIONS.MANAGE_FAQS);
}
