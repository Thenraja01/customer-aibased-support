export const WILDCARD = "*";

export const DEFAULT_ROLE_PERMISSIONS = {
  super_admin: [WILDCARD],
  admin: [
    "users.read",
    "users.write",
    "users.delete",
    "roles.read",
    "roles.write",
    "roles.delete",
    "tickets.read",
    "tickets.write",
    "tickets.delete",
    "chats.read",
    "chats.write",
    "documents.read",
    "documents.write",
    "documents.delete",
    "faqs.read",
    "faqs.write",
    "faqs.delete",
    "analytics.read",
    "settings.read",
    "settings.write",
    "branches.read",
    "branches.write",
    "branches.delete",
    "notifications.read",
    "notifications.write",
    "webhooks.read",
    "webhooks.write",
  ],
  branch_admin: [
    "users.read",
    "users.write",
    "tickets.read",
    "tickets.write",
    "chats.read",
    "chats.write",
    "documents.read",
    "documents.write",
    "faqs.read",
    "faqs.write",
    "analytics.read",
    "notifications.read",
    "notifications.write",
  ],
  support: [
    "tickets.read",
    "tickets.write",
    "chats.read",
    "chats.write",
    "documents.read",
    "faqs.read",
    "notifications.read",
  ],
  customer: [
    "tickets.read",
    "tickets.write",
    "chats.read",
    "chats.write",
    "documents.read",
    "faqs.read",
    "notifications.read",
  ],
};

export const PERMISSION_CATEGORIES = {
  users: ["users.read", "users.write", "users.delete"],
  roles: ["roles.read", "roles.write", "roles.delete"],
  tickets: ["tickets.read", "tickets.write", "tickets.delete"],
  chats: ["chats.read", "chats.write"],
  documents: ["documents.read", "documents.write", "documents.delete"],
  faqs: ["faqs.read", "faqs.write", "faqs.delete"],
  analytics: ["analytics.read"],
  settings: ["settings.read", "settings.write"],
  branches: ["branches.read", "branches.write", "branches.delete"],
  notifications: ["notifications.read", "notifications.write"],
  webhooks: ["webhooks.read", "webhooks.write"],
};

export const hasPermission = (userPermissions, requiredPermission) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes(WILDCARD)) return true;
  return userPermissions.includes(requiredPermission);
};

export const hasAnyPermission = (userPermissions, ...requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes(WILDCARD)) return true;
  return requiredPermissions.some((p) => userPermissions.includes(p));
};

export const hasAllPermissions = (userPermissions, ...requiredPermissions) => {
  if (!userPermissions || !Array.isArray(userPermissions)) return false;
  if (userPermissions.includes(WILDCARD)) return true;
  return requiredPermissions.every((p) => userPermissions.includes(p));
};

export const getPermissionNames = () => {
  const permissions = new Set();
  Object.values(DEFAULT_ROLE_PERMISSIONS).forEach((perms) => {
    perms.forEach((p) => permissions.add(p));
  });
  return Array.from(permissions).sort();
};

export const ROLE_KEYS = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  BRANCH_ADMIN: "branch_admin",
  SUPPORT: "support",
  CUSTOMER: "customer",
};