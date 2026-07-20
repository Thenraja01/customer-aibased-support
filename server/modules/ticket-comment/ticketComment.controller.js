import * as commentService from "./ticketComment.service.js";

export const create = async (req, res) => {
  try {
    const data = {
      ...req.body,
      user_id: req.user.userId,
      organization_id: req.organization?._id || req.user.organizationId,
    };
    const comment = await commentService.createComment(data);
    res.status(201).json({ success: true, data: comment });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getByTicket = async (req, res) => {
  try {
    const isAdmin = req.user.roleName === "admin" || req.user.roleName === "super_admin";
    const includeInternal = isAdmin && req.query.includeInternal === "true";
    const comments = await commentService.getCommentsByTicket(req.params.ticketId, includeInternal);
    res.status(200).json({ success: true, data: comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getById = async (req, res) => {
  try {
    const comment = await commentService.getCommentById(req.params.id);
    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    const status = error.message === "Comment not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const comment = await commentService.updateComment(req.params.id, req.body.comment);
    res.status(200).json({ success: true, data: comment });
  } catch (error) {
    const status = error.message === "Comment not found" ? 404 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await commentService.deleteComment(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Comment not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
