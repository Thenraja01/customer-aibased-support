import * as aiService from "./ai.service.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

// ── Conversation Summary ───────────────────────────────────────────

export const createConversationSummary = asyncHandler(async (req, res) => {
  const summary = await aiService.createConversationSummary({
    ...req.body,
    organization_id: req.user.organization_id,
  });
  res.status(201).json({ success: true, data: summary });
});

export const getConversationSummary = asyncHandler(async (req, res) => {
  const summary = await aiService.getConversationSummary(req.params.chatId);
  if (!summary) {
    return res.status(404).json({ success: false, message: "No summary found for this conversation" });
  }
  res.status(200).json({ success: true, data: summary });
});

export const getConversationSummaries = asyncHandler(async (req, res) => {
  const orgId = req.user.organization_id;
  const summaries = await aiService.getAllConversationSummaries(orgId, {
    resolved: req.query.resolved,
    limit: parseInt(req.query.limit, 10),
    skip: parseInt(req.query.skip, 10),
  });
  res.status(200).json({ success: true, data: summaries });
});

// ── AI Feedback ────────────────────────────────────────────────────

export const createAIFeedback = asyncHandler(async (req, res) => {
  const feedback = await aiService.createAIFeedback({
    ...req.body,
    organization_id: req.user.organization_id,
    user_id: req.user.userId || req.user._id,
  });
  res.status(201).json({ success: true, data: feedback });
});

export const getAIFeedbackStats = asyncHandler(async (req, res) => {
  const stats = await aiService.getAIFeedbackStats(req.user.organization_id);
  res.status(200).json({ success: true, data: stats });
});

export const getFeedbackByChat = asyncHandler(async (req, res) => {
  const feedback = await aiService.getFeedbackByChat(
    req.user.organization_id,
    req.params.chatId
  );
  res.status(200).json({ success: true, data: feedback });
});

// ── AI Usage ────────────────────────────────────────────────────────

export const recordAIUsage = asyncHandler(async (req, res) => {
  const entry = await aiService.recordAIUsage({
    ...req.body,
    organization_id: req.user.organization_id,
    user_id: req.user.userId || req.user._id,
  });
  res.status(201).json({ success: true, data: entry });
});

export const getAIUsageReport = asyncHandler(async (req, res) => {
  const report = await aiService.getAIUsageReport(req.user.organization_id, {
    startDate: req.query.startDate,
    endDate: req.query.endDate,
    model: req.query.model,
    limit: parseInt(req.query.limit, 10),
  });
  res.status(200).json({ success: true, data: report });
});

// ── Background Jobs ────────────────────────────────────────────────

export const enqueueJob = asyncHandler(async (req, res) => {
  const job = await aiService.enqueueJob({
    ...req.body,
    organization_id: req.user.organization_id,
    created_by: req.user.userId || req.user._id,
  });
  res.status(201).json({ success: true, data: job });
});

export const getJobStats = asyncHandler(async (req, res) => {
  const stats = await aiService.getJobStats(req.user.organization_id);
  res.status(200).json({ success: true, data: stats });
});
