import { generateResponse } from "../../modules/llm/index.js";
import { processAIMessage } from "../../modules/chat/aiChat.service.js";
import { normalizeRoleName } from "../../utils/constants.js";
import mongoose from "mongoose";

const ALLOWED_MODELS = ["llama3.2:3b", "qwen2.5:7b", "llama3.1:8b"];
const DEFAULT_MODEL = "qwen2.5:7b"; 
/**
 * Builds the authentication context from req.user
 */
export const getAuthContext = (user) => {
  if (!user) {
    throw new Error("Unauthorized: User session missing.");
  }
  const rawRole =
    user.roleName ||
    (typeof user.role === "string" ? user.role : null) ||
    (Array.isArray(user.roles) && user.roles.length > 0 ? user.roles[0] : null) ||
    user.role_id?.role_name ||
    user.role_id?.name ||
    null;
  const role = normalizeRoleName(rawRole);
  const organizationId = user.organization_id?._id || user.organization_id;
  const branchId = user.branch_id?._id || user.branch_id;
  const branchIds = branchId ? [branchId.toString()] : [];

  return {
    userId: (user._id || user.userId)?.toString(),
    organizationId: organizationId?.toString(),
    role,
    branchIds,
    isSuperAdmin: role === "super_admin",
    permissions: []
  };
};


export const processOrchestratedMessage = async (params) => {
  return await processAIMessage(params);
};
