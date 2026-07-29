import * as feedbackService from "./feedback.service.js";

export const submit = async (req, res) => {
  try {
    const orgId = req.user.organizationId;
    const feedback = await feedbackService.submitFeedback(req.body, orgId);
    res.status(201).json({ success: true, data: feedback });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getByChat = async (req, res) => {
  try {
    const feedback = await feedbackService.getFeedbackByChat(req.params.chatId, req.user.organizationId);
    res.status(200).json({ success: true, data: feedback });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStats = async (req, res) => {
  try {
    const stats = await feedbackService.getFeedbackStats(req.user.organizationId);
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};