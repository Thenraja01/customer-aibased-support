import jwt from "jsonwebtoken";
import env from "../config/env.js";

const ROLE_ALIASES = {
  agent: "support",
  user: "customer",
  member: "customer",
};

const normalizeRoleName = (roleName) => {
  if (!roleName) return "customer";
  const lowered = String(roleName).toLowerCase();
  return ROLE_ALIASES[lowered] || lowered;
};

const expandRoles = (allowedRoles) => {
  const expanded = new Set();
  for (const role of allowedRoles) {
    const normalized = normalizeRoleName(role);
    expanded.add(normalized);
    if (normalized === "admin") expanded.add("super_admin");
    if (normalized === "support") {
      expanded.add("admin");
      expanded.add("super_admin");
    }
  }
  return expanded;
};

export const protect = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    const roleName = normalizeRoleName(decoded.roleName || decoded.role || decoded.role_name);

    req.user = {
      ...decoded,
      userId: decoded.userId || decoded.id || decoded.sub,
      organizationId: decoded.organizationId || decoded.organization_id || null,
      roleName,
      role_id: decoded.roleId || decoded.role_id || null,
    };

    next();
  } catch (error) {
    const message =
      error.name === "TokenExpiredError"
        ? "Unauthorized: Token has expired"
        : "Unauthorized: Invalid token";

    return res.status(401).json({ success: false, message });
  }
};

export const restrict = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const currentRole = normalizeRoleName(req.user.roleName);
    const effectiveRoles = expandRoles(allowedRoles);

    if (!effectiveRoles.has(currentRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to perform this action",
      });
    }

    next();
  };
};

const isStaffOrSuper = (roleName) => ["admin", "support", "super_admin"].includes(normalizeRoleName(roleName));

export const selfOrAdmin = (req, res, next) => {
  const paramId = req.params.id;
  const currentRole = normalizeRoleName(req.user?.roleName);
  const isSelf = String(req.user?.userId) === String(paramId);
  const isStaff = isStaffOrSuper(currentRole);

  if (!isSelf && !isStaff) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You can only access your own data",
    });
  }
  next();
};

export const selfOrAdminParam = (paramName) => {
  return (req, res, next) => {
    const paramId = req.params[paramName];
    const currentRole = normalizeRoleName(req.user?.roleName);
    const isSelf = String(req.user?.userId) === String(paramId);
    const isStaff = isStaffOrSuper(currentRole);

    if (!isSelf && !isStaff) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only access your own data",
      });
    }
    next();
  };
};

export { normalizeRoleName };
