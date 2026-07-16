import jwt from "jsonwebtoken";
import env from "../config/env.js";

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
    req.user = decoded;
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

    if (!allowedRoles.includes(req.user.roleName)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not have permission to perform this action",
      });
    }
    next();
  };
};

// Ensure the requesting user can only access their own resources
// Usage: selfOrAdmin — checks req.params.id
//        selfOrAdminParam("userId") — checks req.params.userId
export const selfOrAdmin = (req, res, next) => {
  const paramId = req.params.id;
  const isSelf = req.user?.userId === paramId;
  const isAdmin = req.user?.roleName === "admin" || req.user?.roleName === "agent";

  if (!isSelf && !isAdmin) {
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
    const isSelf = req.user?.userId === paramId;
    const isAdmin = req.user?.roleName === "admin" || req.user?.roleName === "agent";

    if (!isSelf && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You can only access your own data",
      });
    }
    next();
  };
};
