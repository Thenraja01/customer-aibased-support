/**
 * localStorage keys for the authenticated user session.
 * Keeping them as discrete, named constants so they're visible in
 * DevTools and easy to audit/clear.
 */
export const STORAGE_KEYS = {
  TOKEN: "auth_token",
  REFRESH_TOKEN: "auth_refresh_token",
  USER_ID: "auth_user_id",
  USER: "auth_user",
  ROLE_ID: "auth_role_id",
  ROLE: "auth_role",
  ORG_ID: "auth_org_id",
  ORG_SETTINGS: "auth_org_settings",
  BRANCH_ID: "auth_branch_id",
  NAME: "auth_name",
  EMAIL: "auth_email",
  STATUS: "auth_status",
  SELECTED_TENANT: "selected_tenant_id",
  SELECTED_BRANCH: "selected_branch_id",
} as const;

// ── Safe read / write (guards against SSR & private mode) ──────────

export function safeGetItem<T>(key: string, fallback: T | null = null): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null || raw === undefined) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch {
    return fallback;
  }
}

export function safeSetItem(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`localStorage write failed for key "${key}":`, err);
    return false;
  }
}

/**
 * Strips out heavy server configuration, credentials, guardrails, LLM models,
 * email templates, and ticket forms so ONLY lightweight client branding essentials
 * are persisted in localStorage.
 */
export function sanitizeOrgSettingsForStorage(settings: any) {
  if (!settings || typeof settings !== "object") return null;
  return {
    _id: settings._id,
    organization_id: settings.organization_id,
    name: settings.name,
    brand_colors: settings.brand_colors
      ? {
          primary: settings.brand_colors.primary,
          secondary: settings.brand_colors.secondary,
          accent: settings.brand_colors.accent,
        }
      : undefined,
    loader_config: settings.loader_config
      ? {
          enabled: settings.loader_config.enabled,
          title: settings.loader_config.title,
          subtitle: settings.loader_config.subtitle,
          duration_ms: settings.loader_config.duration_ms,
          bg_theme: settings.loader_config.bg_theme,
        }
      : undefined,
    chatbot_name: settings.chatbot_name,
    widget_theme: settings.widget_theme,
    widget_position: settings.widget_position,
  };
}

// ── User session helpers ────────────────────────────────────────────

export interface SessionUser {
  _id: string;
  userId?: string;
  name: string;
  email: string;
  role: string;
  roleName: string;
  roles?: string[];
  organization_id: string | { _id: string; name: string };
  organizationId?: string;
  [key: string]: any;
}

/** The full set of values we persist after login.
 *  `role`, `tenantId`, `orgId`, and `name` are auto-derived from `user` inside
 *  `saveSession` — callers only need to provide `token` / `user`.
 */
export interface SessionData {
  token: string;
  refreshToken: string;
  user: SessionUser;
  role?: string;
  tenantId?: string;
  orgId?: string;
  name?: string;
  orgSettings?: any;
}

/**
 * Extract the discrete identifiers (user_id, role_id, org_id, etc.) from a
 * user object so each is stored under its own localStorage key and remains
 * visible/debuggable.
 */
function extractSessionFields(user: any): {
  userId: string;
  roleId: string;
  role: string;
  orgId: string;
  branchId: string;
  name: string;
  email: string;
  status: string;
} {
  const userId = user._id || user.userId || "";
  const role = user.role || user.roleName || user.role_id?.role_name || "";
  const roleId = user.role_id?._id || user.role_id || role || "";
  
  const orgObj =
    typeof user.organization_id === "object"
      ? user.organization_id
      : { _id: user.organization_id, name: user.orgName };

  const orgId = orgObj?._id || user.organizationId || "";
  const branchId = user.branch_id?._id || user.branchId || user.branch_id || "";
  const name = user.name || "";
  const email = user.email || "";
  const status = user.status || "";

  return {
    userId: String(userId),
    roleId: String(roleId),
    role,
    orgId: String(orgId),
    branchId: String(branchId),
    name,
    email,
    status,
  };
}

/**
 * Persist the complete session: token, refresh token, sanitized user object, and the
 * discrete user_id, role_id, org_id, etc. fields — each under its own key.
 */
export function saveSession(data: SessionData): boolean {
  const { token, refreshToken, user, orgSettings } = data;

  const { userId, roleId, role, orgId, branchId, name, email, status } = extractSessionFields(user);

  // Minimal sanitized user for storage
  const sanitizedUser = user ? {
    _id: userId,
    name,
    email,
    role,
    roleName: user.roleName || role,
    roles: user.roles || (role ? [role] : []),
    organization_id: orgId,
    branch_id: branchId,
    status,
    avatar: user.avatar,
  } : null;

  const ok =
    safeSetItem(STORAGE_KEYS.TOKEN, token) &&
    safeSetItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken) &&
    safeSetItem(STORAGE_KEYS.USER_ID, userId) &&
    safeSetItem(STORAGE_KEYS.USER, sanitizedUser) &&
    safeSetItem(STORAGE_KEYS.ROLE_ID, roleId) &&
    safeSetItem(STORAGE_KEYS.ROLE, role) &&
    safeSetItem(STORAGE_KEYS.ORG_ID, orgId) &&
    safeSetItem(STORAGE_KEYS.BRANCH_ID, branchId) &&
    safeSetItem(STORAGE_KEYS.NAME, name) &&
    safeSetItem(STORAGE_KEYS.EMAIL, email) &&
    safeSetItem(STORAGE_KEYS.STATUS, status);

  if (orgSettings) {
    safeSetItem(STORAGE_KEYS.ORG_SETTINGS, sanitizeOrgSettingsForStorage(orgSettings));
  }

  if (orgId) {
    safeSetItem(STORAGE_KEYS.SELECTED_TENANT, orgId);
  }

  return ok;
}

/** Read just the discrete session identifiers (used for routing/gating). */
export function getSessionMeta() {
  return {
    userId: safeGetItem<string>(STORAGE_KEYS.USER_ID, ""),
    roleId: safeGetItem<string>(STORAGE_KEYS.ROLE_ID, ""),
    role: safeGetItem<string>(STORAGE_KEYS.ROLE, ""),
    orgId: safeGetItem<string>(STORAGE_KEYS.ORG_ID, ""),
    branchId: safeGetItem<string>(STORAGE_KEYS.BRANCH_ID, ""),
    name: safeGetItem<string>(STORAGE_KEYS.NAME, ""),
    email: safeGetItem<string>(STORAGE_KEYS.EMAIL, ""),
    status: safeGetItem<string>(STORAGE_KEYS.STATUS, ""),
    token: safeGetItem<string>(STORAGE_KEYS.TOKEN, ""),
    user: safeGetItem<any>(STORAGE_KEYS.USER, null),
    orgSettings: safeGetItem<any>(STORAGE_KEYS.ORG_SETTINGS, null),
  };
}

/** Read the full user object. */
export function getUserFromStorage(): any | null {
  return safeGetItem<any>(STORAGE_KEYS.USER, null);
}

/** Read the access token. */
export function getTokenFromStorage(): string | null {
  return safeGetItem<string>(STORAGE_KEYS.TOKEN, null);
}

/** Wipe every session-related key from localStorage. */
export function clearSession(): void {
  Object.values(STORAGE_KEYS).forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  });
  // Clear any legacy un-namespaced keys
  try {
    localStorage.removeItem("orgSettings");
  } catch {
    /* ignore */
  }
}
