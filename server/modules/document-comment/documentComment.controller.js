import * as documentCommentService from "./documentComment.service.js";

export const create = async (req, res) => {
  try {
    const data = { ...req.body, user_id: req.user.userId };
    const comment = await documentCommentService.createComment(data);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getByDocument = async (req, res) => {
  try {
    const comments = await documentCommentService.getByDocument(req.params.documentId);
    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getReplies = async (req, res) => {
  try {
    const replies = await documentCommentService.getReplies(req.params.commentId);
    res.status(200).json({ success: true, data: replies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const query = {};
    if (req.query.document_id) query.document_id = req.query.document_id;
    const comments = await documentCommentService.getAll(query);
    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const comment = await documentCommentService.updateComment(req.params.id, req.body);
    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    const status = error.message === "Comment not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await documentCommentService.deleteComment(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Comment not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
