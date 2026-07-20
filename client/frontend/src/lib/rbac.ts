export const PERMISSIONS = {
  MANAGE_ORGS: "manage_organizations",
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
  MANAGE_DOCUMENTS: "manage_documents",
  VERIFY_DOCUMENTS: "verify_documents",
  ACCESS_CHATBOT: "access_chatbot",
  VIEW_ANALYTICS: "view_analytics",
  MANAGE_FAQS: "manage_faqs",
  CONFIGURE_AI: "configure_ai",
  MANAGE_CONTENT: "manage_content",
  MANAGE_SUBSCRIPTIONS: "manage_subscriptions",
  MONITOR_CONVERSATIONS: "monitor_conversations",
  MANAGE_KNOWLEDGE_BASE: "manage_knowledge_base",
} as const;

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ROLES,
    PERMISSIONS.MANAGE_DOCUMENTS,
    PERMISSIONS.VERIFY_DOCUMENTS,
    PERMISSIONS.ACCESS_CHATBOT,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MANAGE_FAQS,
    PERMISSIONS.CONFIGURE_AI,
    PERMISSIONS.MONITOR_CONVERSATIONS,
    PERMISSIONS.MANAGE_KNOWLEDGE_BASE,
  ],
  agent: [PERMISSIONS.ACCESS_CHATBOT],
  support: [
    PERMISSIONS.ACCESS_CHATBOT,
    PERMISSIONS.MANAGE_DOCUMENTS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.MONITOR_CONVERSATIONS,
  ],
  customer: [PERMISSIONS.ACCESS_CHATBOT],
  user: [PERMISSIONS.ACCESS_CHATBOT],
};

export function hasPermission(roleName: string, permission: string): boolean {
  return ROLE_PERMISSIONS[roleName]?.includes(permission) ?? false;
}

export function hasAnyPermission(
  roleName: string,
  permissions: string[]
): boolean {
  return permissions.some((p) => hasPermission(roleName, p));
}
