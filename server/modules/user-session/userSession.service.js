import UserSession from "./userSession.schema.js";

export const getUserSessions = async (userId) => {
  return await UserSession.find({ user_id: userId, is_revoked: false })
    .sort({ created_at: -1 });
};

export const getAllSessions = async (query = {}) => {
  const filter = {};
  if (query.user_id) filter.user_id = query.user_id;
  if (query.is_revoked !== undefined) filter.is_revoked = query.is_revoked === "true";
  return await UserSession.find(filter)
    .populate("user_id", "name email")
    .sort({ created_at: -1 });
};

export const revokeSession = async (sessionId) => {
  const session = await UserSession.findByIdAndUpdate(
    sessionId,
    { is_revoked: true },
    { new: true }
  );
  if (!session) throw new Error("Session not found");
  return session;
};

export const revokeAllUserSessions = async (userId) => {
  const result = await UserSession.updateMany(
    { user_id: userId, is_revoked: false },
    { is_revoked: true }
  );
  return { message: `${result.modifiedCount} session(s) revoked` };
};

export const deleteSession = async (sessionId) => {
  const session = await UserSession.findByIdAndDelete(sessionId);
  if (!session) throw new Error("Session not found");
  return { message: "Session deleted" };
};
