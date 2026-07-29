import Feedback from "./feedback.schema.js";
import Message from "../message/message.schema.js";
import AISession from "../ai-session/aiSession.schema.js";

export const submitFeedback = async (data, organizationId) => {
  const { chat_id, message_id, user_id, rating, comment, was_helpful } = data;

  const message = await Message.findOne({
    _id: message_id,
    chat_id: chat_id,
  }).lean();
  if (!message) throw new Error("Message not found");

  const existing = await Feedback.findOne({
    user_id: user_id,
    message_id: message_id,
  });
  if (existing) {
    existing.rating = rating;
    existing.comment = comment;
    existing.was_helpful = was_helpful;
    await existing.save();
    return existing;
  }

  const aiSession = await AISession.findOne({ chat_id: chat_id }).select("rag_quality").lean();

  return await Feedback.create({
    chat_id,
    message_id,
    user_id,
    organization_id: organizationId,
    rating,
    comment,
    was_helpful,
    rag_score: aiSession?.rag_quality?.bestScore || null,
    rag_fallback_used: aiSession?.rag_quality?.fallbackUsed || false,
  });
};

export const getFeedbackByChat = async (chatId, organizationId) => {
  return await Feedback.find({
    chat_id: chatId,
    organization_id: organizationId,
  })
    .populate("user_id", "name")
    .sort({ created_at: -1 });
};

export const getFeedbackStats = async (organizationId) => {
  const total = await Feedback.countDocuments({ organization_id: organizationId });
  const avgRating = await Feedback.aggregate([
    { $match: { organization_id: organizationId } },
    { $group: { _id: null, avg: { $avg: "$rating" } } },
  ]);
  const helpfulCount = await Feedback.countDocuments({
    organization_id: organizationId,
    was_helpful: true,
  });
  return {
    total,
    averageRating: avgRating[0]?.avg || 0,
    helpfulCount,
    unhelpfulCount: total - helpfulCount,
  };
};