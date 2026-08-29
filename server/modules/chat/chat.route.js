import express from "express";
import * as chatController from "./chat.controller.js";
import { protect } from "../../middleware/auth.middleware.js";
import { optionalProtect } from "../../middleware/optionalAuth.middleware.js";
import { identifyTenant } from "../../middleware/tenant.middleware.js";
import { checkRole } from "../../middleware/rbac.middleware.js";
import { validate } from "../../middleware/validate.middleware.js";
import { createChatSchema, updateTopicSchema } from "../../validation/index.js";
import { normalizeRoleName, isNormalizedAdminRole } from "../../utils/constants.js";
import Chat from "./chat.schema.js";
import { getQuickActions } from "./quickAction.controller.js";

const STAFF = ["admin", "branch_admin", "support"];

const selfOrStaff = (paramName = "userId") => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
  const userRole = req.user.roleName || req.user.role || req.user.role_id?.role_name;
  const normalized = normalizeRoleName(userRole);
  if (isNormalizedAdminRole(normalized) || normalized === "support") return next();
  const targetId = req.params?.[paramName];
  const userId = req.user.userId || req.user._id;
  if (targetId && targetId.toString() === (userId?.toString?.() || userId)) return next();
  return res.status(403).json({ success: false, message: "Forbidden: You can only access your own chats" });
};

const selfChatOrStaff = () => async (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
  const userRole = req.user.roleName || req.user.role || req.user.role_id?.role_name;
  const normalized = normalizeRoleName(userRole);
  if (isNormalizedAdminRole(normalized) || normalized === "support") return next();

  const targetId = req.params.id;
  const userId = req.user.userId || req.user._id;
  try {
    const chat = await Chat.findById(targetId);
    if (!chat) return res.status(404).json({ success: false, message: "Chat not found" });
    if (chat.user_id && chat.user_id.toString() === userId.toString()) return next();
    return res.status(403).json({ success: false, message: "Forbidden: You do not own this chat" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const router = express.Router();

router.post("/ai", optionalProtect, identifyTenant, chatController.processAI);
router.post("/ai/stream", optionalProtect, identifyTenant, chatController.processAIStream);

router.use(protect);

router.get("/quick-actions", getQuickActions);

router.post("/", validate(createChatSchema), chatController.createNewChat);
router.get("/", checkRole(...STAFF), chatController.getChats);
router.get("/active", checkRole(...STAFF), chatController.getActive);
router.get("/search", checkRole(...STAFF), chatController.search);
router.get("/user/:userId", selfOrStaff(), chatController.getChatsByUserId);
router.get("/user/:userId/count", selfOrStaff(), chatController.getUserChatCount);
router.get("/:id", chatController.getChat);
router.patch("/:id/topic", checkRole(...STAFF), validate(updateTopicSchema), chatController.updateTopic);
router.patch("/close-all", checkRole(...STAFF), chatController.closeAll);
router.patch("/:id/close", selfChatOrStaff(), chatController.close);
router.patch("/:id/reopen", selfChatOrStaff(), chatController.reopen);
router.post("/:id/handoff", selfChatOrStaff(), chatController.handoff);
router.post("/:id/accept-handoff", checkRole(...STAFF), chatController.acceptHandoff);
router.get("/:chatId/copilot-summary", checkRole(...STAFF), chatController.getChatSummary);
router.get("/:chatId/copilot-suggestions", checkRole(...STAFF), chatController.getSuggestedReplies);
router.post("/polish-reply", checkRole(...STAFF), chatController.polishAgentReply);
router.delete("/:id", selfChatOrStaff(), chatController.removeChat);

const publicRouter = express.Router();

publicRouter.use(optionalProtect, identifyTenant);
publicRouter.post("/ai", chatController.processAI);
publicRouter.post("/ai/stream", chatController.processAIStream);

export default router;
export { publicRouter };
