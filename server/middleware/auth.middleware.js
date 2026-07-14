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

// Restrict access to specific roles by role name
// Usage: restrict("admin") or restrict("admin", "manager")
export const restrict = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // req.user.roleId is the ObjectId — attach role name via middleware chain or use roleId comparison
    // For flexibility, you can also pass roleId list if needed
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
// Usage: on routes like GET /users/:id — ensures req.user.userId === req.params.id
export const selfOrAdmin = (req, res, next) => {
  const isSelf = req.user?.userId === req.params.id;
  const isAdmin = req.user?.roleName === "admin";

  if (!isSelf && !isAdmin) {
    return res.status(403).json({
      success: false,
      message: "Forbidden: You can only access your own data",
    });
  }
  next();
};
