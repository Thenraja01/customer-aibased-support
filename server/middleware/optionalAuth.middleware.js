import jwt from "jsonwebtoken";
import env from "../config/env.js";
import User from "../modules/user/user.schema.js";

export const optionalProtect = async (req, res, next) => {
  let token = null;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    req.user = {
      userId: null,
      organizationId: null,
      roleName: "public",
      roleId: null,
      isAnonymous: true,
      tokenData: null,
    };
    req.token = null;
    return next();
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);

    const user = await User.findById(decoded.userId)
      .populate("organization_id")
      .lean();

    if (!user) {
      req.user = {
        userId: null,
        organizationId: null,
        roleName: "public",
        roleId: null,
        isAnonymous: true,
        tokenData: decoded,
      };
      req.token = token;
      return next();
    }

    if (user.status !== "active") {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Account is not active",
      });
    }

    const userRoleName =
      decoded.roleName ||
      user.roleName ||
      user.role ||
      user.role_id?.role_name ||
      "customer";

    req.user = {
      ...user,
      userId: user._id,
      organizationId: user.organization_id?._id || user.organization_id,
      roleId: decoded.roleId || user.role_id?._id || userRoleName,
      role: userRoleName,
      roleName: userRoleName,
      isAnonymous: false,
      tokenData: decoded,
    };

    req.token = token;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      req.user = {
        userId: null,
        organizationId: null,
        roleName: "public",
        roleId: null,
        isAnonymous: true,
        tokenData: null,
      };
      req.token = null;
      return next();
    }

    console.error("Optional auth error:", error.message);
    req.user = {
      userId: null,
      organizationId: null,
      roleName: "public",
      roleId: null,
      isAnonymous: true,
      tokenData: null,
    };
    req.token = null;
    return next();
  }
};

export default { optionalProtect };
