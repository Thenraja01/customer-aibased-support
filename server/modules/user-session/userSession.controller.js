import * as userSessionService from "./userSession.service.js";

export const getMySessions = async (req, res) => {
  try {
    const sessions = await userSessionService.getUserSessions(req.user.userId);
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getAll = async (req, res) => {
  try {
    const sessions = await userSessionService.getAllSessions(req.query);
    res.status(200).json({ success: true, data: sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const revoke = async (req, res) => {
  try {
    const session = await userSessionService.revokeSession(req.params.id);
    res.status(200).json({ success: true, data: session });
  } catch (error) {
    const status = error.message === "Session not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

export const revokeAll = async (req, res) => {
  try {
    const result = await userSessionService.revokeAllUserSessions(req.params.userId || req.user.userId);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const result = await userSessionService.deleteSession(req.params.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message === "Session not found" ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};
