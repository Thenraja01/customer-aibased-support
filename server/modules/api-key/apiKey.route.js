import express from "express";
import { protect, requirePermissions } from "../../middleware/auth.middleware.js";
import { createKey, listKeys, deleteKey } from "./apiKey.controller.js";

const router = express.Router();

router.use(protect);

const restrictToApiKeyAdmins = (req, res, next) => {
  const role = (req.user?.roleName || req.user?.role || "").toLowerCase();
  if (["admin", "super_admin", "branch_admin"].includes(role)) {
    return next();
  }
  return requirePermissions("api_key.manage")(req, res, next);
};

router.post("/", restrictToApiKeyAdmins, createKey);
router.get("/", restrictToApiKeyAdmins, listKeys);
router.delete("/:id", restrictToApiKeyAdmins, deleteKey);

export default router;
